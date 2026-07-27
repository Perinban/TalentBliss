import Header from "../components/header";

const AppLayout = ({ children }) => (
  <div>
    <div className="grid-background" />
    <main className="container mx-auto min-h-screen px-4">
      <Header />
      {children}
    </main>
  </div>
);

export default AppLayout;
