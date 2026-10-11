import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { CartProvider } from './context/CartContext.jsx';
import { LanguageProvider } from './context/LanguageContext.jsx';
import './index.css';
import { AuthProvider } from "./context/AuthContext";


createRoot(document.getElementById('root')).render(
    <StrictMode>
        <BrowserRouter>
            <LanguageProvider>
                <AuthProvider>
                    <CartProvider>
                        <App />
                    </CartProvider>
                </AuthProvider>
            </LanguageProvider>
        </BrowserRouter>
    </StrictMode>
);
