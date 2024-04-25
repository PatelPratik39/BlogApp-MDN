const Blog = require("../models/blog");
const User = require("../models/user");
const utils = require("../services/utils");
const mongoose = require("mongoose");
const chalk = require("chalk");

const logger = require("../logger/index");

// CREATE A BLOG
const createBlog = async (authorId, blogData) => {
  try {
    const { title, description, body, tags } = blogData;
    const reading_time = utils.calculateReadingTime(body);
    const slug = utils.slugIt(title);

    const newBlog = await Blog.create({
      slug: slug,
      title: title,
      description: description,
      body: body,
      tags: tags,
      author: authorId,
      reading_time: reading_time
    });
    logger.info(
      `user with id : ${authorId} created a blogpost ${newBlog._id} succesfully`
    );
    return { status: 201, message: `Blog Created Succesfully`, blog: newBlog };
  } catch (error) {
    console.error(chalk.red(error));
    logger.error(
      chalk.magenta(
        `Error Occured while user with id: ${authorId} tried to create a blogpost \n ${error}`
      )
    );
    return { status: 500, message: `An Error Occured`, error: error };
  }
};

// GET BLOGS USING PARAM

const getBlogs = async (params) => {
  try {
    const page = parseInt(params.page) || 1;
    const limit = parseInt(params.limit) || 20;
    const skip = (page - 1) * limit;
    const search = params.q || "";
    const author = params.author || null;
    const tags = params.tags || null;
    const orderBy = params.orderBy || "-timestamp";

    const searchCriteria = {
      $or: [
        { author: author },
        { title: { $regex: search, $options: "i" } },
        { tags: { $in: [tags] } }
      ],
      state: "published"
    };

    const blogs = await Blog.find(searchCriteria)
      .populate("author", "firstname lastname email")
      .skip(skip)
      .limit(limit)
      .sort(orderBy)
      .exec();

    const total = await Blog.countDocuments(searchCriteria);

    const totalPage = Math.ceil(total / limit);
    logger.info(`BlogPosts fetched Succesfully`);

    return {
      status: 200,
      message: `success`,
      data: { blogs, page, limit, total, totalPage }
    };
  } catch (error) {
    console.error(error);
    logger.error(`Error Occured while fetching blogposts \n ${error}`);
    return { status: 500, message: `An Error Occured`, error: error };
  }
};

// GET BLOGS USING SLUG

const getBlog = async (blogIdOrSlug) => {
  try {
    let blog;

    if (mongoose.Types.ObjectId.isValid(blogIdOrSlug)) {
      blog = await Blog.findOne({
        _id: blogIdOrSlug,
        state: "published"
      })
        .populate({
          path: "author",
          select: "_id firstname lastname email"
        })
        .exec();
    } else {
      blog = await Blog.findOne({
        slug: blogIdOrSlug,
        state: "published"
      }).populate({
        path: "author",
        select: "_id firstname lastname email"
      });
    }

    if (blog) {
      blog.read_count += 1;
      await blog.save();

      logger.info(
        `BlogPost with idOrSlug: ${blogIdOrSlug} returned Succesfully`
      );

      return {
        status: 200,
        message: `Blog Fetched Succesfully`,
        blog: blog,
        author: blog.author
      };
    } else {
      logger.info(`BlogPost with idOrSlug: ${blogIdOrSlug} not Found`);
      return { status: 404, message: `Blog Not Found` };
    }
  } catch (error) {
    console.error(error);
    logger.error(
      `Error Occured while fetching blogpost with id: ${blogIdOrSlug} \n ${error}`
    );
    return { status: 500, message: `An Error Occured`, error: error };
  }
};

// GET BLOGS USING USERID AND BLOGIDORSLUG
const getMyBlog = async (userId, blogIdOrSlug) => {
  try {
    let blog;

    if (mongoose.Types.ObjectId.isValid(blogIdOrSlug)) {
      blog = await Blog.findOne({
        _id: blogIdOrSlug,
        author: userId
      })
        .populate({
          path: "author",
          select: "_id firstname lastname email"
        })
        .exec();
    } else {
      blog = await Blog.findOne({
        slug: blogIdOrSlug,
        author: userId
      }).populate({
        path: "author",
        select: "_id firstname lastname email"
      });
    }

    if (blog) {
      logger.info(
        `BlogPost with idOrSlug: ${blogIdOrSlug} returned Succesfully`
      );

      return { status: 200, message: `Blog Fetched Succesfully`, blog: blog };
    } else {
      logger.info(`BlogPost with idOrSlug: ${blogIdOrSlug} not Found`);
      return {
        status: 404,
        message: `Blog Not Found or doesn't belong to you`
      };
    }
  } catch (error) {
    console.error(error);
    logger.error(
      `Error Occured while fetching blogpost with id: ${blogIdOrSlug} \n ${error}`
    );
    return { status: 500, message: `An Error Occured`, error: error };
  }
};

// UPDATE BLOG

const updateBlog = async (authorId, blogId, updateBlogData) => {
  try {
    const blogExist = await Blog.findOne({ _id: blogId, author: authorId });

    if (!blogExist) {
      return {
        status: 404,
        message: `Blog with ID ${blogId} not found or doesn't belong to you`
      };
    }
    let slug;
    let reading_time;
    if (updateBlogData.body) {
      reading_time = utils.calculateReadingTime(updateBlogData.body);
    }
    if (updateBlogData.title) {
      slug = utils.slugIt(updateBlogData.title);
    }

    blogExist.title = updateBlogData.title || blogExist.title;
    blogExist.description = updateBlogData.description || blogExist.description;
    blogExist.tags = updateBlogData.tags || blogExist.tags;
    blogExist.body = updateBlogData.body || blogExist.body;
    blogExist.slug = slug || blogExist.slug;
    blogExist.reading_time = reading_time || blogExist.reading_time;
    blogExist.state = updateBlogData.state || blogExist.state;

    await blogExist.save();

    logger.info(
      `User with id: ${authorId} updated blog: ${blogId} succesfully`
    );

    return {
      status: 200,
      message: "Blog updated successfully",
      blog: blogExist
    };
  } catch (error) {
    console.error(error);
    logger.error(
      `Error Occured while user with id: ${authorId} trying to update blog: ${blogId} \n ${error}`
    );
    return { status: 500, message: "Error updating the blog", error };
  }
};

// DELETE THE BLOG

const deleteBlog = async (authorId, blogId) => {
  try {
    const blog = await Blog.findOneAndDelete({ author: authorId, _id: blogId });

    if (!blog) {
      return {
        status: 404,
        message: `Blog with ID ${blogId} not found or doesn't belong to you`
      };
    }
    logger.info(
      `User with id: ${authorId} deleted blog: ${blogId} succesfully`
    );

    return {
      status: 200,
      message: `Blog with ID ${blogId}  deleted succesfully`,
      blog
    };
  } catch (error) {
    console.error(error);
    logger.error(
      `Error Occured while user with id: ${authorId} trying to delete blog: ${blogId} \n ${error}`
    );
    return { status: 500, message: "Error deleting the blog", error };
  }
};

// PULISH THE BLOG
const publishBlog = async (authorId, blogId) => {
  try {
    const blog = await Blog.findOne({ author: authorId, _id: blogId });

    if (!blog) {
      return {
        status: 404,
        message: `Blog with ID ${blogId} not found or doesn't belong to you`
      };
    }

    blog.state = "published";
    await blog.save();

    logger.info(
      `User with id: ${authorId} published blog: ${blogId} succesfully`
    );

    const author = await User.findById(authorId);
    const authorData = { ...author._doc };
    delete authorData["password"];

    return {
      status: 200,
      message: `Blog Published Succesfully!!!`,
      blog,
      author: authorData
    };
  } catch (error) {
    console.error(error);
    logger.error(
      `Error Occured while user with id: ${authorId} trying to publish blog: ${blogId} \n ${error}`
    );
    return { status: 500, message: "Error publishing the blog", error };
  }
};


const myBlogService = async (authorId, params) => {
  try {
    const page = parseInt(params.page) || 1;
    const limit = parseInt(params.limit) || 20;
    const skip = (page - 1) * limit;
    const search = params.q || "";
    const state = params.state || ["draft", "published"];
    const tags = params.tags ? params.tags : null;
    const orderBy = params.orderBy || "-timestamp";

    const searchCriteria = {
      $or: [
        { title: { $regex: search, $options: "i" } },
        { tags: { $in: tags } }
      ],
      author: authorId,
      state: { $in: state }
    };

    const blogs = await Blog.find(searchCriteria)
      .skip(skip)
      .limit(limit)
      .sort(orderBy)
      .exec();

    const total = await Blog.countDocuments(searchCriteria);

    logger.info(`user: ${authorId} fetched their BlogPosts Succesfully`);

    return {
      status: 200,
      message: `Your Owned Blogs fetched succesfully`,
      data: { blogs, page, limit, total }
    };
  } catch (error) {
    console.error(error);
    logger.error(
      `Error Occured while user with id: ${authorId} trying to fetch their Blogs \n ${error}`
    );
    return { status: 500, message: `An Error Occured`, error: error };
  }
};

const tagInBlogService = async (tag) => {
  try {
    const blogs = await Blog.find({
      tags: { $in: [tag] },
      state: "published"
    }).exec();

    return {
      status: 200,
      message: `Blogs with tag ${tag} fetched successfully`,
      blogs
    };
  } catch (error) {
    console.error(error);
    logger.error(
      `Error occurred while fetching blogs with the tag: ${tag}\n${error}`
    );
    return { status: 500, message: `An Error Occurred`, error: error };
  }
};

const blogService = {
  createBlog,
  getBlogs,
  getBlog,
  getMyBlog,
  updateBlog,
  deleteBlog,
  publishBlog,
  myBlogService,
  tagInBlogService
};

module.exports = blogService;