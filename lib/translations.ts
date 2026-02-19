export const translateError = (message: string): string => {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('invalid login credentials')) {
        return 'Email ou senha incorretos.';
    }

    if (lowerMessage.includes('user already registered')) {
        return 'Este e-mail já está cadastrado.';
    }

    if (lowerMessage.includes('email not confirmed')) {
        return 'E-mail não confirmado. Verifique sua caixa de entrada.';
    }

    if (lowerMessage.includes('password should be at least 6 characters')) {
        return 'A senha deve ter pelo menos 6 caracteres.';
    }

    if (lowerMessage.includes('invalid email address')) {
        return 'Endereço de e-mail inválido.';
    }

    if (lowerMessage.includes('too many requests')) {
        return 'Muitas solicitações. Tente novamente mais tarde.';
    }

    if (lowerMessage.includes('network error')) {
        return 'Erro de conexão. Verifique sua internet.';
    }

    if (lowerMessage.includes('user not found')) {
        return 'Usuário não encontrado.';
    }

    // Default messages
    if (lowerMessage.includes('error sending confirmation mail')) {
        return 'Erro ao enviar e-mail de confirmação.';
    }

    return message;
};
