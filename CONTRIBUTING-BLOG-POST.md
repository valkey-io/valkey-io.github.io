# Contributing a Blog Post

You are welcome to contribute a blog post for valkey.io.
The contribution model is lightweight, transparent, and uses well-understood open-source processes.

## Step 0: Setup

Before you begin, it’s a good idea to setup an environment to write, test, and contribute your blog post.
First, [fork the website repo](https://github.com/valkey-io/valkey-io.github.io), then clone the website to your local environment.
The general workflow is to write your post locally in a branch, confirm that it looks the way you want, then contribute your changes as a pull request.

The README has instructions on how to get up-and-running with Zola, the software used to build and test the website.

## Step 1: Ideation

The first step is to share your idea with the website maintainers through a GitHub issue.
In the issue articulate what topic you want to write about and a general overview.
The maintainers will evaluate your idea to understand if it fits into the site and doesn’t overlap with existing or in-process content.
The maintainers will provide feedback as needed.

Strictly speaking, you can forego this step and contribute a blog post directly as a pull request.
However, if you don’t get the feedback from the maintainers you run the risk of doing work that doesn’t translate efficiently (or at all) into a blog post.

## Step 2: Writing the post

Write your blog post in markdown.
Generally, you’ll be better off sticking to headings, links, paragraphs and code blocks (there is no prohibition of using other markdown features though).
A few writing tips:

1. Blog posts should be consumable in one sitting.
Aim for 500-1,200 words.
2. Blog posts should cover a topic entirely.
    1. If you start writing and realize that your post will be super long, consider refining your topic.
    2. Sometimes there are very good reasons to link multiple posts together, but length is not one; aim to make each post independent and not part of a series.
3. Highly technical is fine but understand that [valkey.io](http://valkey.io/) is read by a variety of skill levels: the best posts make complex topics easy to understand.
4. [Valkey.io](http://valkey.io/) is not a commercial space; you can write about services and products as long as a) you’re not actively selling/promoting and b) the subject matter is directly related to the use of Valkey.
    1. Acceptable Example: A post that describes the lessons learned about operating Valkey at scale gleaned from a Valkey service provider.
    2. Unacceptable Example: A post that describes the advantages of running Valkey through a specific service.
5. Write about Valkey.
There is a ton of things to say about Valkey without venturing into comparisons with other products and projects.
6. Have a call-to-action.
What do you want your readers to do next after they finish your blog post? The call-to-action can be something like asking a users to contribute, try some sample code, or come to an event.
You can even just invite readers to consume related content.
7. Speak for yourself.
Blog posts are attributed to a person, not the project, so feel free to have opinions and write in the first (I) or second (you) grammatical person.
Unless you have specific authority (and you probably don’t!), avoid speaking for groups of people.

## Step 3: Write about yourself

Blog posts on [valkey.io](http://valkey.io/) need to have at least one author.
This needs to be a person: it does not need to be birth name or even a traditional name, but it can’t be a collective (e.g. “The Good Code Team” would be unacceptable).
Ideally, this you write under a transparent and accountable name where you can be identified in the Valkey community.

Each author needs to have a biography.
The bio should be 1-2 paragraphs in length and should tell the reader who you are.
Additionally, use the space to link yourself to the community: what makes you a person the reader should read and spend time on.
If you already have a bio from a previous post, you don’t need to do a new one.

It’s optional, but blog posts are even better when you have a bio *and* a photo.
This personalizes the content further and conveys that you’re a real person.
Attaching a photo isn’t always possible, so don’t fret if you don’t want to attach one.

## Step 4: Put everything together

[Valkey.io](http://valkey.io/) follows Zola format to build the website: each page requires what’s called *frontmatter*.
*Frontmatter* is a short snippet of [TOML](https://toml.io/en/) surrounded by `+++` that defines metadata about your post.

Here is an example of the frontmatter:

```text
+++
# `title` is how your post will be listed and what will appear at the top of the post
title=  "Using Valkey for mind control experiments"
# `date` is when your post will be published.
# For the most part, you can leave this as the day you _started_ the post.
# The maintainers will update this value before publishing
# The time is generally irrelvant in how Valkey published, so '01:01:01' is a good placeholder
date= 2024-07-01 01:01:01
# 'description' is what is shown as a snippet/summary in various contexts.
# You can make this the first few lines of the post or (better) a hook for readers.
# Aim for 2 short sentences.
description= "It's become clear that people want to talk about Valkey and have been publishing blog posts/articles fervently. Here you'll find a collection of all the post I'm aware of in the last few weeks."
# 'authors' are the folks who wrote or contributed to the post.
# Each author corresponds to a biography file (more info later in this document)
authors= [ "maury", "jacobim" ]
categories= "update"
trending= true
+++
```

You combine frontmatter with your writing into a single markdown file.
The frontmatter must start at the first character on the first line of the file and your markdown goes below it.
The name of the markdown file relevant.
The path and general format is:

```text
/content/blog/yyyy-mm-dd-post-title-with-dashes-instead-of-spaces.md
```

The date portion (`yyyy-mm-dd`) is for internal organization purposes: this makes the blog post file easy to find and Zola ignores valid dates in this format.
The *slug* (`post-title-with-dashes-instead-of-spaces` in the example) will form the URL of the blog post.
So, the example would yield a blog post with a URL of `https://valkey.io/blog/post-title-with-dashes-instead-of-spaces/` .

You’ll also need to create frontmatter for each author file.
As an example:

```text
+++
# 'title' is how you want your name presented
title= "Jacobim Mugatu"
[extra]
    # 'photo' is the path to the (optional) photo.
    # the photo should be stored in `/assets/media/authors/`
    # Try to get a medium resolution square-ish image (aim for around 500x500 but no more than 1000x1000)
    photo= "/assets/media/authors/jacobim.jpg"
    # 'github' is the (optional) link to your GitHub ID.
    # For example if you can access your GitHub profile at https://github.com/octocat then you would use "octocat"
    github= "octocat"
+++

```

Like with the blog post itself, following the frontmatter is the markdown biography.
You can save the file to `/content/authors/YOUR-ID.md` , replacing `YOUR-ID` with some unique identifier (maybe align it with your name, GitHub ID, or an email address).
The ID chosen should also match the `extra.authors`  in the post.
So, for the example above it would be `/content/authors/jacobim.md` to match the string in the post’s frontmatter for `extra.authors` (`[ "maury", "jacobim" ]` ).

At this point you should be able to test with `zola serve` as outlined in the README.
If you made any syntax errors in your frontmatter the Zola process will display an error message.
Proof read your post and bio(s), making any adjustments as needed.

## Step 5: Make the contribution

Now that you have a satisfactory blog post, you can make the contribution.
Even if you’re used to making contributions to open source projects, Valkey uses a DCO so the process and commands might be a little different than what you’re used to.
The CONTRIBUTING.md file goes over in detail what a DCO is and how to make a contribution with a DCO sign off.

Keep in mind that you sign off your *commits* but GitHub checks for the sign offs when you make a *pull request;* it’s easier to fix a problem with the DCO sign-off before you make a pull request.
The best practice is to run `git log` and ensure that every commit you’re about to contribute has `Signed-off-by:`  in the commit message, after confirming then run `git push origin ...`  .

After your contribution is on your fork in GitHub, you can make a pull request to the website repo.
Make sure to communicate your change fully in the body of the pull request.

## Step 6: From contribution to publishing

After your contribution is made, the website maintainers will review the post.
They may have feedback for you and ask you to make changes.
Once everyone is satisfied with the post, the maintainers will merge it into the `main` branch.
The `main` branch of the repo represents the *future* state of all integrated changes before publishing.
At this point, the maintainers make further changes to your post to properly schedule or link the post.
Once this occurs, the maintainers will make move the changes into ‘production’ which will trigger a rebuild and publishing of the content website to [Valkey.io](http://valkey.io/)