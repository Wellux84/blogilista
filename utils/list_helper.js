const dummy = (blogs) => {
  return 1
}
  
const totalLikes = (blogs) => {
  return blogs.reduce((sum, blog) => sum + blog.likes, 0)
}

const favoriteBlog = (blogs) => {

  
  const favorite = blogs.reduce((prev, current) => 
    current.likes > prev.likes ? current : prev
  )
  
  return {
    title: favorite.title,
    author: favorite.author,
    likes: favorite.likes
  };
};

  module.exports = {
    dummy,
    totalLikes,
    favoriteBlog
  }

