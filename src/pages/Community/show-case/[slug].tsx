import { Navigate, useParams } from 'react-router-dom';
import { ShowCaseDetail } from '../../../components/community/ShowCaseDetail';
import { mockShowCases } from '../../../data/showCase';

export default function ShowCasePage() {
  const { slug } = useParams();
  const showCase = mockShowCases.find((sc) => sc.slug === slug);
  const otherShowCases = mockShowCases.filter((sc) => sc.slug !== slug);

  if (!showCase) {
    return <Navigate to="/community" replace />;
  }

  return <ShowCaseDetail showCase={showCase} otherShowCases={otherShowCases} />;
} 