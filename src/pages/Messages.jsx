import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function Messages() {
  const navigate = useNavigate();
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const friend = urlParams.get('friend');
    const dest = friend
      ? createPageUrl(`Friends?tab=messages&friend=${friend}`)
      : createPageUrl('Friends?tab=messages');
    navigate(dest, { replace: true });
  }, []);
  return null;
}