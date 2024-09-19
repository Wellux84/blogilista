const { test, describe, beforeEach, after } = require('node:test')
const assert = require('node:assert')
const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const api = supertest(app)
const bcrypt = require('bcryptjs')

const listHelper = require('../utils/list_helper')

const Blog = require('../models/blog')
const User = require('../models/user')


test('dummy returns one', () => {
  const blogs = []

  const result = listHelper.dummy(blogs)
  assert.strictEqual(result, 1)
})



beforeEach(async () => {
  await Blog.deleteMany({})

  await Blog.insertMany(listHelper.blogs)
})

describe('total likes', () => {

  test('Sum of all likes', () => {
    const result = listHelper.totalLikes(listHelper.blogs)
    assert.strictEqual(result, 36)
  })
})

describe('favoriteBlog', () => {
  test('Most likes', () => {
    const result = listHelper.favoriteBlog(listHelper.blogs)
    assert.deepStrictEqual(result, {
      title: "Canonical string reduction",
      author: "Edsger W. Dijkstra",
      likes: 12
    })
  })
})

test('six blogs', async () => {
  const response = await api.get('/api/blogs')

  assert.strictEqual(response.body.length, 6)
})

test('the first note is about HTTP methods', async () => {
  const response = await api.get('/api/blogs')

  const contents = response.body.forEach(blog => {
  assert.ok(blog.id)
 })
})

test('a valid blog can be added', async () => {
  const newBlog = {
    title: 'Test for add blog',
    author: 'Wellux',
    url: 'www.jotain.co',
    likes: 0
  }

  await api
    .post('/api/blogs')
    .send(newBlog)
    .expect(201)
    .expect('Content-Type', /application\/json/)

  const response = await api.get('/api/blogs')

  const contents = response.body.map(r => r.title)

  assert.strictEqual(response.body.length, listHelper.blogs.length + 1)

  assert(contents.includes('Test for add blog'))
})

test('Likes not defined set to 0', async () => {
  const newBlog = {
    title: 'Test for add blog without likes',
    author: 'Wellux',
    url: 'www.jotain.co',
  }

  const response = await api.post('/api/blogs').send(newBlog)
  const savedBlog = response.body

  assert.strictEqual(savedBlog.likes, 0, 'likes field should default to 0 if not provided')
})

test('Test for title missing', async () => {
  const newBlog = {
    title: 'Test for add blog without likes',
    author: 'Wellux',
    likes: 2
  }

  const response = await api.post('/api/blogs').send(newBlog)
  assert.strictEqual(response.status, 400, 'Should return 400 if url is missing')
})

test('Test for url missing', async () => {
  const newBlog = {
    author: 'Wellux',
    url: 'www.jotain.co',
    likes: 2
  }

  const response = await api.post('/api/blogs').send(newBlog)
  assert.strictEqual(response.status, 400, 'Should return 400 if title is missing')
})


test('delete a blog with status 204', async () => {
  const blogToDelete = listHelper.blogs[0]

  const response = await api.delete(`/api/blogs/${blogToDelete._id}`).expect(204)

  const blogsAfterDelete = await Blog.find({})
  assert.strictEqual(blogsAfterDelete.length, 5)
})


test('update likes', async () => {
  const blogToUpdate = listHelper.blogs[0]

  const updatedLikes = { likes: 10 }

  const response = await api
    .put(`/api/blogs/${blogToUpdate._id}`)
    .send(updatedLikes)
    .expect(200)

  assert.strictEqual(response.body.likes, 10)
})


test('should return 400 if blog does not exist', async () => {
  const nonExistingId = 'hnn786'

  const updatedLikes = { likes: 10 }

  await api
    .put(`/api/blogs/${nonExistingId}`)
    .send(updatedLikes)
    .expect(400)
})

describe('when there is initially one user at db', () => {
  beforeEach(async () => {
    await User.deleteMany({})

    const passwordHash = await bcrypt.hash('sekret', 10)
    const user = new User({ username: 'root', name: "testt", passwordHash })

    await user.save()
  })

  test('creation succeeds with a new username', async () => {
    const usersAtStart = await listHelper.usersInDb()

    const newUser = {
      username: 'Welluxx',
      name: 'Wellu',
      password: 'jotain',
    }

    await api
      .post('/api/users')
      .send(newUser)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const usersAtEnd = await listHelper.usersInDb()
    assert.strictEqual(usersAtEnd.length, usersAtStart.length + 1)

    const usernames = usersAtEnd.map(u => u.username)
    assert(usernames.includes(newUser.username))
  })

  test('creation fails with invalid username', async () => {
  

    const newUser = {
      username: 'We',
      name: 'Wellu',
      password: 'jotain',
    }

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)

      assert(result.body.error.includes('Invalid username or password. Length must be at least 3'))
  })

test('creation fails with invalid password', async () => {
  

  const newUser = {
    username: 'Welluxxx',
    name: 'wellu',
    password: 'sa',
  }

  const result = await api
    .post('/api/users')
    .send(newUser)
    .expect(400)

    assert(result.body.error.includes('Invalid username or password. Length must be at least 3'))
})
})

after(async () => {
  await User.deleteMany({})
  await mongoose.connection.close()
  console.log('All tests completed')
})