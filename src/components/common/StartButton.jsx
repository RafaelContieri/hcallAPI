import React from 'react'
import './StartButton.css'

const START_ICON = '/imgs/ticket-details/start.svg'

/**
 * StartButton - Botão para iniciar ou finalizar um chamado
 * @component
 * 
 * @param {Object} props - Propriedades do componente
 * @param {string} [props.text='Iniciar Chamado'] - Texto do botão
 * @param {Function} props.onClick - Função chamada ao clicar no botão
 * @param {boolean} [props.isLoading=false] - Estado de carregamento (desabilita o botão)
 * @param {boolean} [props.disabled=false] - Desabilita o botão
 * @param {string} [props.loadingText='Atualizando...'] - Texto exibido durante carregamento
 * @param {React.ReactNode} [props.icon] - Ícone customizado (padrão é o ícone start.svg)
 * 
 * @returns {React.ReactElement} Componente de botão
 * 
 * @example
 * <StartButton 
 *   text="Iniciar Chamado"
 *   onClick={handleStart}
 *   isLoading={isLoading}
 * />
 */
function StartButton({
  text = 'Iniciar Chamado',
  onClick,
  isLoading = false,
  disabled = false,
  loadingText = 'Atualizando...',
  icon = START_ICON
}) {
  return (
    <button
      type="button"
      className="start-button"
      onClick={onClick}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
    >
      <img src={icon} alt="" aria-hidden="true" />
      {isLoading ? loadingText : text}
    </button>
  )
}

export default StartButton
