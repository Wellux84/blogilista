const { test, describe, beforeEach, after } = require('node:test')
const assert = require('node:assert')
const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const api = supertest(app)

const listHelper = require('../utils/list_helper')

const Blog = require('../models/blog')



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

after(async () => {
  await mongoose.connection.close()

  console.log('All tests completed')
})