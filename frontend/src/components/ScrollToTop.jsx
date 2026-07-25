import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
    const { pathname } = useLocation();

    useEffect(() => {
        // Cuộn lên vị trí cao nhất (0, 0)
        window.scrollTo(0, 0);
    }, [pathname]);

    return null; // Component này không render bất kỳ UI nào
};

export default ScrollToTop;
