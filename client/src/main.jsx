import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider } from './store/Provider';
import { routes } from './routes';
import ScrollToTop from './components/ScrollToTop';

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <Provider>
            <Router>
                <ScrollToTop />
                <Routes>
                    {routes.map((route, index) => (
                        <Route key={index} path={route.path} element={route.component}>
                            {route.children?.map((child, childIndex) => (
                                <Route 
                                    key={childIndex} 
                                    index={child.path === ''}  // Nếu path rỗng → index route
                                    path={child.path === '' ? undefined : child.path}   // Index route không có path nên undefined
                                    element={child.component} 
                                />
                            ))}
                        </Route>
                    ))}
                </Routes>
            </Router>
        </Provider>
    </StrictMode>,
);
