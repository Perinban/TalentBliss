import { Outlet } from "react-router-dom";
import Header from "../components/header";

const AppLayout = () => {
    return(
        <div>
            <div className="grid-background"></div>
            <main className="min-h-screen container mx-auto px-4">
                <Header />
                <Outlet />
            </main>
        </div>
    )
}

export default AppLayout;