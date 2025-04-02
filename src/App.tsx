import { ChakraProvider } from '@chakra-ui/react';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout';
import { Blog } from './pages/Blog';
import { BlogPost } from './pages/BlogPost';
import { Clients } from './pages/Clients';
import { CommandReference } from './pages/CommandReference';
import Community from './pages/Community';
import CodeOfConduct from './pages/Community/CodeOfConduct';
import FAQ from './pages/Community/FAQ';
import ShowCasePage from './pages/Community/show-case/[slug]';
import { Connect } from './pages/Connect';
import { Documentation } from './pages/Documentation';
import { Download } from './pages/Download';
import { Home } from './pages/Home';
import { ParticipantsPage } from './pages/Participants';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { TermsOfService } from './pages/TermsOfService';
import theme from './theme';

function App() {
  return (
    <ChakraProvider theme={theme} resetCSS>
      <Router>
        <MainLayout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/download" element={<Download />} />
            <Route path="/topics/*" element={<Documentation />} />
            <Route path="/commands/:command?" element={<CommandReference />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/community" element={<Community />} />
            <Route path="/community/faq" element={<FAQ />} />
            <Route path="/community/code-of-conduct" element={<CodeOfConduct />} />
            <Route path="/community/show-case/:slug" element={<ShowCasePage />} />
            <Route path="/participants" element={<ParticipantsPage />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-of-service" element={<TermsOfService />} />
            <Route path="/connect" element={<Connect />} />
            <Route path="/clients" element={<Clients />} />
          </Routes>
        </MainLayout>
      </Router>
    </ChakraProvider>
  );
}

export default App;
