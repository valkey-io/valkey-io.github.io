import { IconType } from 'react-icons';
import { BiSolidBookBookmark } from 'react-icons/bi';
import {
  BsBugFill,
  BsFillLightbulbFill,
  BsFillQuestionCircleFill,
  BsShieldLockFill,
} from 'react-icons/bs';
import { FaPeopleGroup } from 'react-icons/fa6';
import { FiGithub, FiLinkedin, FiTwitter } from 'react-icons/fi';

export interface ContributeWay {
  title: string;
  description: string;
  icon: IconType;
  buttons?: {
    label: string;
    href: string;
    icon?: IconType;
  }[];
}

export const contributeWays: ContributeWay[] = [
  {
    icon: BsFillQuestionCircleFill,
    title: 'Ask Questions',
    description:
      'If you have any inquiries about Valkey, feel free to join the conversation on our GitHub discussions or chat with us on Slack.',
    buttons: [
      { label: 'GitHub Repository', href: 'https://github.com/orgs/valkey-io/discussions', icon: FiGithub },
      { label: 'Slack', href: 'https://valkey-oss-developer.slack.com/join/shared_invite/zt-2nxs51chx-EB9hu9Qdch3GMfRcztTSkQ#/shared-invite/email' },
    ],
  },
  {
    icon: BsBugFill,
    title: 'Report Bugs',
    description:
      'If you encounter any issues while using Valkey, please help us improve the project by filing a bug report at our GitHub repository.',
    buttons: [
      {
        label: 'GitHub Repository',
        href: 'https://github.com/valkey-io/valkey/issues/new?assignees=&labels=&projects=&template=bug_report.md&title=%5BBUG%5D',
        icon: FiGithub,
      },
    ],
  },
  {
    icon: FaPeopleGroup,
    title: 'Connect on Social Media',
    description: 'Stay updated and connect with us on our social media platforms.',
    buttons: [
      { label: 'LinkedIn', href: 'https://www.linkedin.com/company/valkey/', icon: FiLinkedin },
      { label: 'Twitter', href: 'https://x.com/valkey_io', icon: FiTwitter },
    ],
  },
  {
    icon: BsFillLightbulbFill,
    title: 'Suggest Features',
    description:
      'We value your ideas! If you have a suggestion for a new feature, please submit a feature request on our GitHub.',
    buttons: [
      {
        label: 'GitHub',
        href: 'https://github.com/valkey-io/valkey/issues/new?assignees=&labels=&projects=&template=feature_request.md&title=%5BNEW%5D',
        icon: FiGithub,
      },
    ],
  },
  {
    icon: BsShieldLockFill,
    title: 'Security Concerns',
    description: 'For any potential security issues, please refer to our Security Policy.',
    buttons: [{ label: 'Learn more →', href: 'https://github.com/valkey-io/valkey/blob/unstable/SECURITY.md' }],
  },
  {
    icon: BiSolidBookBookmark,
    title: 'Community Conduct',
    description:
      'If you experience any issues with community members behavior, kindly check our Code of Conduct for guidance.',
    buttons: [{ label: 'Learn more →', href: '/community/code-of-conduct' }],
  },
]; 