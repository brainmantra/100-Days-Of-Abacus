import { useState } from 'react';
import VerificationBox from '../components/VerificationBox';
import WelcomeScreen from '../components/WelcomeScreen';
import api from '../services/api';

export default function Home() {
  const [status, setStatus] = useState('idle'); // idle, loading, error, success
  const [user, setUser] = useState(null);

  const handleVerify = async (mobileNumber) => {
    setStatus('loading');
    try {
      const response = await api.post('/verify', { mobile_number: mobileNumber });
      setUser(response.data);
      setStatus('success');
      localStorage.setItem('abacusUser', JSON.stringify(response.data));
    } catch (error) {
      setStatus('error');
      setTimeout(() => {
        // Replace with your actual Google Form Link
        window.location.href = "https://forms.gle/YOUR_GOOGLE_FORM_LINK";
      }, 3000);
    }
  };

  if (status === 'success' && user) {
    return <WelcomeScreen user={user} />;
  }

  return <VerificationBox onVerify={handleVerify} status={status} />;
}