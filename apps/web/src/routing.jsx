import {
  Link as WouterLink,
  Redirect,
  useLocation as useWouterLocation,
  useParams,
} from "wouter";

export function Link({ to, children, ...props }) {
  return (
    <WouterLink href={to} {...props}>
      {children}
    </WouterLink>
  );
}

export function Navigate({ to, replace = false }) {
  return <Redirect to={to} replace={replace} />;
}

export function useNavigate() {
  const [, navigate] = useWouterLocation();
  return (to, options = {}) => navigate(to, { replace: Boolean(options.replace) });
}

export function useLocation() {
  const [pathname] = useWouterLocation();
  return { pathname: pathname.split("?", 1)[0] };
}

export function useSearchParams() {
  const [location, navigate] = useWouterLocation();
  const params = new URLSearchParams(window.location.search);
  const setParams = (next, options = {}) => {
    const rendered = next instanceof URLSearchParams ? next.toString() : new URLSearchParams(next).toString();
    const pathname = location.split("?", 1)[0];
    navigate(pathname + (rendered ? "?" + rendered : ""), { replace: Boolean(options.replace) });
  };
  return [params, setParams];
}

export { useParams };
