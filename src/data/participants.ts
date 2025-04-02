import aivenLogo from '/src/assets/images/aiven.svg';
import awsLogo from '/src/assets/images/aws.svg';
import ericssonLogo from '/src/assets/images/ericsson.svg';
import googleLogo from '/src/assets/images/gcp.svg';
import oracleLogo from '/src/assets/images/oracle.svg';
import perconaLogo from '/src/assets/images/percona.svg';
import upcloudLogo from '/src/assets/images/upcloud.svg';

export interface Participant {
  name: string;
  desc: string;
  logo: string;
  content: string;
}

export const participants: Participant[] = [
  {
    name: 'Aiven',
    desc: 'In-memory NoSQL database with a small footprint and big performance. It is built on open source Valkey and compatible with legacy Redis®',
    logo: aivenLogo,
    content: `
      <div class="participant-content">
        <h3>Valkey offering:</h3>
        <p>Aiven for Valkey is a managed, in-memory NoSQL database with a small footprint and big performance. It is built on open source Valkey and compatible with legacy Redis® OSS.</p>
        <h3>About the company:</h3>
        <p>Aiven is a versatile platform empowering you with AI-driven workload optimization and control over your data. Deploy widely adopted technologies across multiple clouds with just a few clicks to stream, store, and serve your data.</p>
      </div>
    `,
  },
  {
    name: 'Amazon Web Services',
    desc: 'It merges Valkeys speed and versatility with Amazons manageability, perfect for data-driven applications.',
    logo: awsLogo,
    content: `
      <div class="participant-content">
        <h3>Valkey offering:</h3>
        <p>Amazon ElastiCache is a fully managed, Valkey-compatible service delivering real-time, cost-optimized performance. ElastiCache scales to millions of operations per second with microsecond latency and enterprise-level security and reliability. With ElastiCache, you combine the speed, simplicity, and versatility of Valkey with the manageability, security, and scalability from Amazon to power the most demanding data-driven applications in Gaming, Ad-Tech, E-Commerce, Healthcare, Financial Services, and IoT.</p>
        <h3>About the company:</h3>
        <p>Amazon Web Services (AWS) is the worlds most comprehensive and broadly adopted cloud, offering over 200 fully featured services from data centers globally. Millions of customers—including the fastest-growing startups, largest enterprises, and leading government agencies—are using AWS to lower costs, become more agile, and innovate faster.</p>
      </div>
    `,
  },
  {
    name: 'Percona',
    desc: 'Provides Valkey expertise whenever you need it, offering day-to-day operational support and hands-on assistance for complex projects.',
    logo: perconaLogo,
    content: `
      <div class="participant-content">
        <h3>Valkey offering:</h3>
        <p>Valkey expertise, where and when you need it. From day-to-day operational support to hands-on assistance for complex projects, Percona can meet your Valkey database needs. We’ll soon be offering support, managed services, and project-based consulting, so together, we can tackle any challenge and continue to keep open source, open.</p>
        <h3>About the company:</h3>
        <p>Percona is a world-class open source database software, support, and services company. The organization is dedicated to helping businesses ensure their databases — and the applications that depend on them — are secure, compliant, performant, and highly available. For more information, visit www.percona.com</p>
      </div>
    `,
  },
  {
    name: 'UpCloud',
    desc: 'With UpClouds global reach, Valkey guarantees reliability and scalability, allowing developers to focus on building outstanding applications.',
    logo: upcloudLogo,
    content: `
      <div class="participant-content">
        <h3>Valkey offering:</h3>
        <p>Valkey on UpCloud simplifies database management with a fully managed service hosted on our GDPR-compliant cloud. Enjoy seamless deployment, expert maintenance, and high performance with minimal downtime. Backed by UpCloud’s global reach, Valkey ensures reliability and scalability, freeing developers to focus on building great applications./p>
        <h3>About the company:</h3>
        <p>UpCloud is a leading European cloud provider with a global platform spanning four continents and 13 data centres. Founded in 2012 and headquartered in Helsinki, Finland, our international team ensures uninterrupted services with a 100% SLA, empowering businesses worldwide to thrive with our reliable, cloud-native product portfolio.</p>
      </div>
    `,
  },
  {
    name: 'Google Cloud',
    desc: 'Google Cloud Memorystore is a versatile, fully-managed, in-memory database service for Valkey, offering sub-millisecond data access, scalability, and high availability.',
    logo: googleLogo,
    content: `
      <div class="participant-content">
        <h3>Valkey offering:</h3>
        <p>Google Cloud Memorystore is a versatile, fully-managed, in-memory database service for Valkey, offering sub-millisecond data access, scalability, and high availability.</p>
        <h3>About the company:</h3>
        <p>Our mission at Google Cloud is to accelerate every organization's ability to digitally transform its business and industry. We empower our customers to become digital and AI leaders by combining Google's AI innovation with differentiated solutions for compute, app development, data, security, and collaboration — all built on Google's reliable and planet-scale infrastructure.</p>
      </div>
    `,
  },
  {
    name: 'Ericsson',
    desc: 'Founded in 1876, Ericsson is a Swedish communication technology and services provider.',
    logo: ericssonLogo,
    content: `
      <div class="participant-content">
        <h3>About the company:</h3>
        <p>Founded in 1876, Ericsson is a Swedish communication technology and services provider. The company offers software, services, and infrastructure for information and communications technology used by telecommunications operators, including traditional telecommunications, Internet Protocol networking equipment and business support solutions. Ericsson is headquartered in Stockholm, Sweden.</p>
      </div>
    `,
  },
  {
    name: 'Oracle',
    desc: 'Oracle Cloud Infrastructure (OCI) is a deep and broad platform of public cloud services that enables customers to build and run a wide range of applications in a scalable, secure, highly available, fault-tolerant, and high-performance environment.',
    logo: oracleLogo,
    content: `
      <div class="participant-content">
        <h3>Valkey offering:</h3>
        <p>Achieve sub-millisecond latency with <a href="https://www.oracle.com/cloud/cache/" target="_blank">Oracle Cloud Infrastructure (OCI) Cache.</a></p>
        <h3>About the company:</h3>
        <p>Oracle Cloud Infrastructure (OCI) is a deep and broad platform of public cloud services that enables customers to build and run a wide range of applications in a scalable, secure, highly available, fault-tolerant, and high-performance environment.</p>
      </div>
    `,
  },
]; 