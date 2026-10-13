import { Header } from "@/components/layout/Header";
import { HistoryDrawer } from "@/components/layout/HistoryDrawer";
import { Workspace } from "@/components/layout/Workspace";

export default function Home() {
  return (
    <>
      <Header />
      <Workspace />
      <HistoryDrawer />
    </>
  );
}