export default function Layout({ children, currentPageName }) {
  return (
    <div key={currentPageName} className="page-enter">
      {children}
    </div>
  );
}
