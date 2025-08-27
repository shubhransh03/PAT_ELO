import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';

export default function RoleInitializer() {
  const { user, isLoaded } = useUser();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoaded || !user) return;
    const params = new URLSearchParams(location.search);
    const desired = params.get('setRole') || params.get('intendedRole');
    if (!desired) return;

    const current = user.publicMetadata?.role;
    if (current === desired) {
      if (location.search) navigate(location.pathname, { replace: true });
      return;
    }

    user.update({ publicMetadata: { ...user.publicMetadata, role: desired } })
      .then(() => navigate(location.pathname, { replace: true }))
      .catch(() => navigate(location.pathname, { replace: true }));
  }, [isLoaded, user, location, navigate]);

  return null;
}
