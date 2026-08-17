import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api_login } from "../../api/auth";
import useFeedback from "../../components/feedback/useFeedback";
import "./Login.css";

const heroImage = "https://www.figma.com/api/mcp/asset/a5d6dea4-5c4e-459b-84c6-9de87b78097e.svg";
const emailIcon = "https://www.figma.com/api/mcp/asset/1d75c006-6554-4759-b3d1-93fe05314c37.svg";
const passwordIcon = "https://www.figma.com/api/mcp/asset/d5a5d6f5-d77b-4c71-81f1-15aa408eda26.svg";
const showIcon = "https://www.figma.com/api/mcp/asset/1ddf9394-52c3-4605-b80d-49c68909be28.svg";

const LoginForm = () => {
    const navigate = useNavigate();
    const { showError } = useFeedback();
    const [formData, setFormData] = useState({
        email: "",
        password: ""
    });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const togglePasswordVisibility = () => {
        setShowPassword((prev) => !prev);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const result = await api_login(formData.email, formData.password);
            if (result.success) {
                navigate("/dashboard");
            } else {
                showError({
                    title: "Falha no login",
                    message: result.error || "Não foi possível entrar com os dados informados."
                });
            }
        } catch (err) {
            showError({
                title: "Falha no login",
                message: "Erro ao conectar com o servidor. Tente novamente."
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container">
            <div className="login-container">
                <div className="left-side">
                    <div className="hero-card">
                        <img src={heroImage} alt="H-Call Logo" className="hero-logo" />
                        <p className="hero-subtitle">Controle de chamados, na palma da sua mão !</p>
                    </div>
                </div>
                <div className="right-side">
                    <div className="form-panel">
                        <div className="form-header">
                            <h2>Realize seu login</h2>
                        </div>

                        <form onSubmit={handleSubmit} className="login-form">
                            <div className="input-group">
                                <img src={emailIcon} alt="Email icon" className="input-icon" />
                                <input
                                    type="email"
                                    name="email"
                                    placeholder="E-mail"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    disabled={loading}
                                />
                            </div>

                            <div className="input-group">
                                <img src={passwordIcon} alt="Password icon" className="input-icon" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    placeholder="Senha"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    disabled={loading}
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={togglePasswordVisibility}
                                    tabIndex={-1}
                                    disabled={loading}
                                >
                                    <img src={showIcon} alt="Mostrar senha" />
                                </button>
                            </div>

                            <div className="forgot-row">
                                <button type="button" className="forgot-link">Esqueci minha senha</button>
                            </div>

                            <button type="submit" className="login-button" disabled={loading}>
                                {loading ? "Entrando..." : "Entrar"}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginForm;
