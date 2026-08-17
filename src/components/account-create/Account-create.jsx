import React, { useEffect, useRef, useState } from 'react'
import './Account-create.css'
import { createUser } from '../../api/createUser'
import useFeedback from '../feedback/useFeedback'

const FORM_ICONS = {
    back: '/imgs/user-create/back.svg',
    avatar: '/imgs/user-create/avatar.svg',
    name: '/imgs/user-create/name.svg',
    email: '/imgs/user-create/email.svg',
    phone: '/imgs/user-create/phone.svg',
    lock: '/imgs/user-create/lock.svg',
    eye: '/imgs/user-create/eye.svg',
    create: '/imgs/user-create/create.svg',
    cancel: '/imgs/user-create/cancel.svg'
}

const EMPTY_FORM = {
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'admin'
}

const formatPhone = (value) => {
    const digits = value.replace(/\D/g, '').slice(0, 11)

    if (digits.length <= 2) return digits ? `(${digits}` : ''
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
    if (digits.length <= 10) {
        return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
    }

    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

const AccountCreate = ({ onCancel, onCreated }) => {
    const { showConfirmation, showError, showSuccess, showWarning } = useFeedback()
    const [formData, setFormData] = useState(EMPTY_FORM)
    const [isLoading, setIsLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [avatarPreview, setAvatarPreview] = useState('')
    const fileInputRef = useRef(null)

    useEffect(() => () => {
        if (avatarPreview.startsWith('blob:')) URL.revokeObjectURL(avatarPreview)
    }, [avatarPreview])

    const handleInputChange = (event) => {
        const { name, value } = event.target

        setFormData((current) => ({
            ...current,
            [name]: name === 'phone' ? formatPhone(value) : value
        }))
    }

    const handleAvatarChange = (event) => {
        const file = event.target.files?.[0]
        if (!file) return

        if (!file.type.startsWith('image/')) {
            showWarning({
                title: 'Preencha as informações corretas',
                message: 'Selecione um arquivo de imagem válido.'
            })
            event.target.value = ''
            return
        }

        if (file.size > 5 * 1024 * 1024) {
            showWarning({
                title: 'Preencha as informações corretas',
                message: 'A foto deve possuir no máximo 5 MB.'
            })
            event.target.value = ''
            return
        }

        if (avatarPreview.startsWith('blob:')) URL.revokeObjectURL(avatarPreview)
        setAvatarPreview(URL.createObjectURL(file))
    }

    const validateForm = () => {
        if (!formData.name.trim() || !formData.email.trim() || !formData.password) {
            return 'Preencha todos os campos obrigatórios.'
        }

        if (formData.name.trim().length < 3) return 'Informe o nome completo do usuário.'
        if (formData.password.length < 6) return 'A senha deve possuir pelo menos 6 caracteres.'

        return ''
    }

    const handleSubmit = async (event) => {
        event.preventDefault()
        const validationError = validateForm()

        if (validationError) {
            showWarning({
                title: 'Preencha as informações corretas',
                message: validationError
            })
            return
        }

        setIsLoading(true)

        const payload = {
            name: formData.name.trim(),
            email: formData.email.trim().toLowerCase(),
            phone: formData.phone.replace(/\D/g, ''),
            password: formData.password,
            role: formData.role
        }

        try {
            const result = await createUser(payload)

            if (!result.success) {
                throw new Error(result.error || 'Não foi possível criar o usuário.')
            }

            setFormData({ ...EMPTY_FORM })
            setAvatarPreview('')
            showSuccess({
                title: 'Sucesso !',
                message: 'Usuário criado com sucesso!',
                onClose: () => onCreated?.(result.data)
            })
        } catch (error) {
            showError({
                title: 'Falha ao criar usuário',
                message: error.message || 'Não foi possível criar o usuário.'
            })
        } finally {
            setIsLoading(false)
        }
    }

    const handleCancel = async () => {
        if (isLoading) return

        const hasUnsavedData = Boolean(
            formData.name || formData.email || formData.phone || formData.password || avatarPreview
        )

        if (hasUnsavedData) {
            const confirmed = await showConfirmation({
                title: 'Tem certeza que deseja cancelar este cadastro?'
            })

            if (!confirmed) return
        }

        setFormData({ ...EMPTY_FORM })
        setAvatarPreview('')
        onCancel?.()
    }

    return (
        <section className="create-user-page">
            <button type="button" className="create-user-back" onClick={handleCancel}>
                <img src={FORM_ICONS.back} alt="" aria-hidden="true" />
                Voltar para lista
            </button>

            <article className="create-user-card">
                <span className="create-user-accent" aria-hidden="true" />

                <form className="create-user-form" onSubmit={handleSubmit} noValidate>
                    <div className="create-user-avatar-block">
                        <button
                            type="button"
                            className="create-user-avatar"
                            onClick={() => fileInputRef.current?.click()}
                            aria-label="Selecionar foto do usuário"
                        >
                            {avatarPreview ? (
                                <img src={avatarPreview} alt="Pré-visualização do usuário" />
                            ) : (
                                <img src={FORM_ICONS.avatar} alt="" aria-hidden="true" />
                            )}
                        </button>
                        <button
                            type="button"
                            className="create-user-edit-photo"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            Editar foto
                        </button>
                        <input
                            ref={fileInputRef}
                            className="create-user-file-input"
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarChange}
                        />
                    </div>

                    <header className="create-user-header">
                        <h1>Criar Novo Usuário</h1>
                        <p>Preencha os dados para cadastrar</p>
                    </header>

                    <div className="create-user-divider" />

                    <div className="create-user-fields">
                        <label className="create-user-field" htmlFor="create-user-name">
                            <span>Nome completo <strong>*</strong></span>
                            <span className="create-user-input-wrap">
                                <img src={FORM_ICONS.name} alt="" aria-hidden="true" />
                                <input
                                    id="create-user-name"
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    placeholder="Digite o nome completo"
                                    autoComplete="name"
                                    required
                                />
                            </span>
                        </label>

                        <label className="create-user-field" htmlFor="create-user-email">
                            <span>Email <strong>*</strong></span>
                            <span className="create-user-input-wrap">
                                <img src={FORM_ICONS.email} alt="" aria-hidden="true" />
                                <input
                                    id="create-user-email"
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    placeholder="exemplo@email.com"
                                    autoComplete="email"
                                    required
                                />
                            </span>
                        </label>

                        <label className="create-user-field" htmlFor="create-user-phone">
                            <span>Telefone</span>
                            <span className="create-user-input-wrap">
                                <img src={FORM_ICONS.phone} alt="" aria-hidden="true" />
                                <input
                                    id="create-user-phone"
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    placeholder="(00) 00000-0000"
                                    autoComplete="tel"
                                    inputMode="numeric"
                                />
                            </span>
                        </label>

                        <label className="create-user-field" htmlFor="create-user-password">
                            <span>Senha <strong>*</strong></span>
                            <span className="create-user-input-wrap create-user-password-wrap">
                                <img src={FORM_ICONS.lock} alt="" aria-hidden="true" />
                                <input
                                    id="create-user-password"
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    placeholder="Mínimo 6 caracteres"
                                    autoComplete="new-password"
                                    minLength={6}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((visible) => !visible)}
                                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                                >
                                    <img src={FORM_ICONS.eye} alt="" aria-hidden="true" />
                                </button>
                            </span>
                        </label>

                        <fieldset className="create-user-role">
                            <legend>Tipo de Usuário</legend>
                            <label>
                                <input
                                    type="radio"
                                    name="role"
                                    value="admin"
                                    checked={formData.role === 'admin'}
                                    onChange={handleInputChange}
                                />
                                <span className="create-user-radio" />
                                Administrador
                            </label>
                        </fieldset>
                    </div>

                    <div className="create-user-divider" />

                    <div className="create-user-actions">
                        <button type="submit" className="create-user-submit" disabled={isLoading}>
                            <img src={FORM_ICONS.create} alt="" aria-hidden="true" />
                            {isLoading ? 'Criando...' : 'Criar Usuário'}
                        </button>
                        <button type="button" className="create-user-cancel" onClick={handleCancel} disabled={isLoading}>
                            <img src={FORM_ICONS.cancel} alt="" aria-hidden="true" />
                            Cancelar
                        </button>
                    </div>
                </form>
            </article>
        </section>
    )
}

export default AccountCreate
