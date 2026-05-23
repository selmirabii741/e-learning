import './globals.css';
import { Toaster } from 'react-hot-toast';
import KeycloakProvider from '@/lib/KeycloakProvider';

export const metadata = {
  title: 'EduAI – Plateforme E-Learning',
  description: 'Plateforme e-learning intelligente avec tuteur IA, quiz adaptatifs et suivi de progression.',
};

// Blocking script that runs before paint to prevent theme flicker.
// It reads localStorage and sets the correct class on <html> immediately.
const themeScript = `
(function() {
  try {
    var v = localStorage.getItem('theme_v');
    if (v !== '3') {
      localStorage.setItem('theme', 'dark');
      localStorage.setItem('theme_v', '3');
    }
    var t = localStorage.getItem('theme');
    var isDark = t !== 'light';
    document.documentElement.classList.add(isDark ? 'dark' : 'light');
    document.documentElement.classList.remove(isDark ? 'light' : 'dark');
  } catch(e) {
    document.documentElement.classList.add('dark');
  }
})();
`;

export default function RootLayout({ children }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <KeycloakProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#1c1c30',
                color: '#e2e8f0',
                border: '1px solid rgba(99,102,241,0.2)',
                borderRadius: '12px',
              },
            }}
          />
        </KeycloakProvider>
      </body>
    </html>
  );
}
