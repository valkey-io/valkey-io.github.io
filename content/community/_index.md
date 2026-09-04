+++
title = "Community"
description = "Join the Valkey community: contribute code, docs, and content, speak at events, and connect with other Valkey users."
template = "community-home.html"
page_template = "community.html"
[extra]
hero = { title = "Unlock. Contribute. Repeat.", subtitle = "Every key contributor started somewhere: a bug report, a talk, a line of code. This community is built one key at a time. Yours starts here.", image = "/img/community/hero-community.jpg" }

connect = { title = "Connect with us", description = "Ask questions, share ideas, and meet the Valkey community.", links = [
  { url = "/slack", text = "Join Slack" },
  { url = "https://github.com/orgs/valkey-io/discussions", text = "GitHub Discussions" }
] }

photos = [
  { src = "/img/community/community-photo-01.jpg", alt = "Two Valkey speakers presenting on a conference stage" },
  { src = "/img/community/community-photo-02.jpg", alt = "Valkey maintainers at the KeySpace Beijing community meetup" },
  { src = "/img/community/community-photo-08.jpg", alt = "Valkey China community members at the Tencent Cloud booth" },
  { src = "/img/community/community-photo-12.jpg", alt = "A speaker presenting at PyCon AU with Valkey as a sponsor", position = "center 25%" },
  { src = "/img/community/community-photo-03.jpg", alt = "Community members celebrating Valkey's second birthday" },
  { src = "/img/community/community-photo-07.jpg", alt = "Contributors posing with a wooden Valkey logo at the birthday celebration" },
  { src = "/img/community/community-photo-05.jpg", alt = "Valkey team members greeting visitors at a conference booth" },
  { src = "/img/community/community-photo-06.jpg", alt = "Two speakers on stage during a Valkey conference talk" },
  { src = "/img/community/community-photo-13.jpg", alt = "Valkey community members at the SCaLE conference booth" },
  { src = "/img/community/community-photo-09.jpg", alt = "Panel discussion at the KeySpace Beijing community event" },
  { src = "/img/community/community-photo-10.jpg", alt = "Valkey community members at the Unlocked Conference photo booth" },
  { src = "/img/community/community-photo-11.jpg", alt = "Student contributors wearing Valkey shirts at a community event" },
  { src = "/img/community/community-photo-04.jpg", alt = "React Hyderabad and Valkey community members at a meetup hosted at Amazon" }
]

cards = [
  { icon = "icon-code.svg", title = "Contribute to Core", description = "Help build the Valkey engine itself. Browse open issues, read the contributing guide, and submit a pull request to the core repository.", links = [
    { url = "https://github.com/valkey-io/valkey", text = "GitHub Repository" },
    { url = "https://github.com/valkey-io/valkey/blob/unstable/CONTRIBUTING.md", text = "Contributing Guide" }
  ] },
  { icon = "icon-modules.svg", title = "Contribute to Modules", description = "Extend Valkey's capabilities by contributing to modules such as Valkey Search, Valkey Bloom, Valkey JSON, or the Rust module SDK (valkeymodule-rs).", links = [
    { url = "https://github.com/orgs/valkey-io/repositories", text = "Valkey Modules on GitHub" }
  ] },
  { icon = "icon-bug.svg", title = "Submit a Bug / Security Vulnerability", description = "If you encounter an issue while using Valkey, please help us improve the project by filing a bug report. For potential security issues, please follow our security policy instead of opening a public issue.", links = [
    { url = "https://github.com/valkey-io/valkey/issues/new?assignees=&labels=&projects=&template=bug_report.md&title=%5BBUG%5D", text = "Report a Bug" },
    { url = "https://github.com/valkey-io/valkey/blob/unstable/SECURITY.md", text = "Security Policy" }
  ] },
  { icon = "icon-book.svg", title = "Contribute to Documentation", description = "Help make Valkey easier to learn and use. Documentation content, tutorials, and topic guides live in the valkey-doc repository and welcome pull requests.", links = [
    { url = "https://github.com/valkey-io/valkey-doc", text = "valkey-doc Repository" }
  ] },
  { icon = "icon-bulb.svg", title = "Feature Requests", description = "We value your ideas! If you have a suggestion for a new feature, submit a feature request on GitHub and help shape the roadmap.", links = [
    { url = "https://github.com/valkey-io/valkey/issues/new?assignees=&labels=&projects=&template=feature_request.md&title=%5BNEW%5D", text = "Submit a Feature Request" }
  ] },
  { icon = "icon-content.svg", title = "Content: Blogs / Videos", description = "Share your Valkey story. Write a blog post, record a demo, or contribute a tutorial video to help others learn from your experience.", links = [
    { url = "https://github.com/valkey-io/community/blob/main/1.%20Community%20Blog%20Guidelines.md", text = "Blog Guidelines" },
    { url = "https://github.com/valkey-io/community/blob/main/2.%20Youtube-video-guideline.md", text = "Video Guidelines" }
  ] },
  { icon = "icon-mic.svg", title = "Speak", description = "Speaking at a conference? Let us know. Looking for speaking opportunities? CFPs are also listed in the Slack channel.", links = [
    { url = "https://valkey-oss-developer.slack.com/archives/C0B8XC9A30Q", text = "#valkey-speakers" }
  ] },
  { icon = "icon-users.svg", title = "Meetups / Events", description = "Join or organize a Valkey meetup near you, and attend an upcoming event.", links = [
    { url = "/community/meetup-groups/", text = "Meetup Groups & Charter" },
    { url = "https://github.com/valkey-io/valkey-io.github.io/issues/new?template=new-meetup-group.md", text = "Start a New Meetup Group" },
    { url = "/events/", text = "Upcoming Events" }
  ] },
  { icon = "icon-news.svg", title = "Get the Latest News", description = "Stay updated and connect with us on our social media platforms and newsletter.", links = [
    { url = "https://www.linkedin.com/company/valkey/", text = "LinkedIn" },
    { url = "https://bsky.app/profile/valkeyio.bsky.social", text = "Bluesky" },
    { url = "https://x.com/valkey_io", text = "X" },
    { url = "#email-signup", text = "Newsletter" }
  ] }
]

conduct = { title = "Community Conduct", description = "Help keep the Valkey community welcoming, inclusive, and respectful for everyone.", link = { url = "/code_of_conduct", text = "Read the Code of Conduct" } }
+++

## Ways to contribute
Pick the path that matches how you want to help.
