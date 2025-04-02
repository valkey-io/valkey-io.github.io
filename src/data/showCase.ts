export interface ShowCase {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  imageUrl: string;
  date: string;
  category: string;
}

export const mockShowCases: ShowCase[] = [
  {
    id: '1',
    title: 'Project Name',
    date: 'Wednesday January 8, 2025',
    excerpt: 'By implementing AZ affinity routing in Valkey and using GLIDE, you can achieve lower latency and cost savings by routing requests to replicas in the same AZ as the client.',
    slug: 'project-name-slug',
    category: 'tutorials',
    imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop',
    content: `
      <h2>Implementing AZ Affinity Routing</h2>
      <p>In this tutorial, we'll explore how to optimize your application's performance using <b>AZ affinity routing</b> in Valkey.</p>
      
      <h3>Key Benefits</h3>
      <ul>
        <li><b>Reduced Latency:</b> Direct routing to same-AZ replicas</li>
        <li><b>Cost Savings:</b> Minimize cross-AZ data transfer</li>
        <li><b>Improved Reliability:</b> Better fault isolation</li>
      </ul>
      
      <p>The implementation process involves several key steps that we'll cover in detail.</p>
    `
  },
  {
    id: '2',
    title: 'Long Project Name in One Line',
    date: 'Friday December 20, 2024',
    excerpt: 'The end of the calendar year is a great time to reflect, but for Valkey this particular year-end holds special meaning.',
    slug: 'long-project-name-slug',
    category: 'news',
    imageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2070&auto=format&fit=crop',
    content: `
      <h2>Year in Review: Our Journey and Achievements</h2>
      <p>As we approach the end of this remarkable year, we want to share some of our most significant milestones.</p>
      
      <h3>Major Achievements</h3>
      <ul>
        <li><b>Platform Growth:</b> 200% increase in active users</li>
        <li><b>New Features:</b> Launched 15 major updates</li>
        <li><b>Community:</b> Over 1000 contributors worldwide</li>
      </ul>
      
      <p>We're incredibly grateful to our <b>amazing community</b> for their continued support.</p>
    `
  },
  {
    id: '3',
    title: 'Really, Really Long Project Name in Two Lines',
    date: 'Thursday November 21, 2024',
    excerpt: "While most people won't go to production on a Raspberry Pi, we'll cover how to thoroughly performance test Valkey to understand how it works in production.",
    slug: 'really-long-project-name-slug',
    category: 'case-studies',
    imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=2070&auto=format&fit=crop',
    content: `
      <h2>Performance Testing on Raspberry Pi</h2>
      <p>Learn how to conduct thorough performance testing using a Raspberry Pi as your development environment.</p>
      
      <h3>Testing Methodology</h3>
      <ul>
        <li><b>Baseline Testing:</b> Establishing performance metrics</li>
        <li><b>Load Testing:</b> Simulating production scenarios</li>
        <li><b>Resource Monitoring:</b> Tracking system utilization</li>
      </ul>
      
      <p>While this setup isn't meant for production, it provides valuable insights into system behavior.</p>
    `
  },
  {
    id: '4',
    title: 'Project Name',
    date: 'Tuesday March 4, 2025',
    excerpt: 'Discover strategies to optimize Valkey performance under heavy loads, including caching, parallel processing, and load balancing techniques.',
    slug: 'project-name-slug',
    category: 'tutorials',
    imageUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=2034&auto=format&fit=crop',
    content: `
      <h2>Optimizing Valkey Under Heavy Loads</h2>
      <p>Performance optimization is crucial for maintaining responsive applications under stress.</p>
      
      <h3>Key Optimization Strategies</h3>
      <ul>
        <li><b>Caching Implementation:</b> Redis and in-memory solutions</li>
        <li><b>Parallel Processing:</b> Worker threads and async operations</li>
        <li><b>Load Balancing:</b> Distribution techniques and algorithms</li>
      </ul>
      
      <p>We'll explore each of these strategies with practical examples and benchmarks.</p>
    `
  },
  {
    id: '5',
    title: 'Project Name',
    date: 'Wednesday January 8, 2025',
    excerpt: 'By implementing AZ affinity routing in Valkey and using GLIDE, you can achieve lower latency and cost savings by routing requests to replicas in the same AZ as the client.',
    slug: 'project-name-slug',
    category: 'tutorials',
    imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop',
    content: `
      <h2>Advanced GLIDE Integration with Valkey</h2>
      <p>Take your application to the next level by integrating GLIDE with Valkey's routing system.</p>
      
      <h3>Integration Benefits</h3>
      <ul>
        <li><b>Smart Routing:</b> Intelligent request distribution</li>
        <li><b>Performance Gains:</b> Up to 40% latency reduction</li>
        <li><b>Cost Efficiency:</b> Optimized resource utilization</li>
      </ul>
      
      <p>Follow our step-by-step guide to implement this powerful combination.</p>
    `
  },
  {
    id: '6',
    title: 'Long Project Name in One Line',
    date: 'Friday December 20, 2024',
    excerpt: 'The end of the calendar year is a great time to reflect, but for Valkey this particular year-end holds special meaning.',
    slug: 'long-project-name-slug',
    category: 'news',
    imageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2070&auto=format&fit=crop',
    content: `
      <h2>Celebrating Innovation and Growth</h2>
      <p>This year marks a significant milestone in Valkey's journey toward revolutionizing cloud infrastructure.</p>
      
      <h3>Notable Developments</h3>
      <ul>
        <li><b>Technology Breakthroughs:</b> New patent-pending algorithms</li>
        <li><b>Team Expansion:</b> Welcomed 50+ new team members</li>
        <li><b>Global Reach:</b> Now serving clients in 30+ countries</li>
      </ul>
      
      <p>Join us as we look back on a year of unprecedented growth and innovation.</p>
    `
  },
  {
    id: '7',
    title: 'Really, Really Long Project Name in Two Lines',
    date: 'Thursday November 21, 2024',
    excerpt: "While most people won't go to production on a Raspberry Pi, we'll cover how to thoroughly performance test Valkey to understand how it works in production.",
    slug: 'really-long-project-name-slug',
    category: 'case-studies',
    imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=2070&auto=format&fit=crop',
    content: `
      <h2>Deep Dive: Performance Testing Methodology</h2>
      <p>Understanding performance characteristics is crucial for production readiness.</p>
      
      <h3>Testing Framework</h3>
      <ul>
        <li><b>Metrics Collection:</b> Key performance indicators</li>
        <li><b>Stress Testing:</b> Beyond normal operating conditions</li>
        <li><b>Analysis Tools:</b> Recommended monitoring solutions</li>
      </ul>
      
      <p>Learn how to build a comprehensive testing strategy for your deployment.</p>
    `
  },
  {
    id: '8',
    title: 'Project Name',
    date: 'Tuesday March 4, 2025',
    excerpt: 'Discover strategies to optimize Valkey performance under heavy loads, including caching, parallel processing, and load balancing techniques.',
    slug: 'project-name-slug',
    category: 'tutorials',
    imageUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=2034&auto=format&fit=crop',
    content: `
      <h2>Advanced Load Balancing Techniques</h2>
      <p>Master the art of distributing workloads effectively across your infrastructure.</p>
      
      <h3>Implementation Strategies</h3>
      <ul>
        <li><b>Algorithm Selection:</b> Choosing the right approach</li>
        <li><b>Health Checks:</b> Maintaining system reliability</li>
        <li><b>Scaling Policies:</b> Automated resource management</li>
      </ul>
      
      <p>Implement these strategies to build a more resilient and efficient system.</p>
    `
  },
];
