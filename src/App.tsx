import { StoreProvider } from "./store";
import { ToastProvider } from "./components/Toast";
import { Home } from "./components/Home";
import { Editor } from "./components/Editor";
import { useHash } from "./lib/router";

function AppRouter() {
  const hash = useHash();
  return hash.startsWith("#/editor") ? <Editor /> : <Home />;
}

export default function App() {
  return (
    <StoreProvider>
      <ToastProvider>
        <AppRouter />
      </ToastProvider>
    </StoreProvider>
  );
}
