/**
 * Utilitários para lidar com datas (YYYY-MM-DD) sem problemas de fuso horário.
 */

/**
 * Converte uma string 'YYYY-MM-DD' ou ISO Timestamp em um objeto Date local (meia-noite).
 * Evita o problema onde '2023-10-25' vira '2023-10-24 21:00' devido ao GMT-3.
 */
export const parseISO = (dateStr: string): Date => {
    if (!dateStr) return new Date();

    // Se for um timestamp ISO completo (contém T ou espaço e :), tenta dar parse direto
    // mas ajustando para meio-dia para evitar problemas de fuso no Dashboard
    if (dateStr.includes('T') || (dateStr.includes('-') && dateStr.includes(':'))) {
        const d = new Date(dateStr);
        return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0);
    }

    const [year, month, day] = dateStr.split('-').map(Number);
    // Mês no JS é 0-indexed (Janeiro = 0)
    return new Date(year, month - 1, day, 12, 0, 0); // Usamos meio-dia para garantir margem de erro
};

/**
 * Verifica se uma data está dentro do período selecionado.
 * Centraliza a lógica para evitar discrepâncias entre telas.
 */
export const isInRange = (
    dateString: string,
    timeRange: 'TODAY' | 'WEEK' | 'MONTH' | 'YEAR' | 'CUSTOM',
    options: {
        customStart?: string;
        customEnd?: string;
        selectedMonth?: number;
        selectedYear?: number;
    } = {}
) => {
    if (!dateString) return false;

    const dateToCheck = parseISO(dateString);
    dateToCheck.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { customStart, customEnd, selectedMonth, selectedYear } = options;

    if (timeRange === 'CUSTOM') {
        if (customStart && dateToCheck < parseISO(customStart)) return false;
        if (customEnd) {
            const endLimit = parseISO(customEnd);
            endLimit.setHours(23, 59, 59, 999);
            if (dateToCheck > endLimit) return false;
        }
        return true;
    }

    if (timeRange === 'TODAY') return dateToCheck.getTime() === today.getTime();

    if (timeRange === 'WEEK') {
        const weekAgo = new Date(today);
        weekAgo.setDate(today.getDate() - 7);
        return dateToCheck >= weekAgo && dateToCheck <= today;
    }

    if (timeRange === 'MONTH') {
        const month = selectedMonth ?? today.getMonth();
        const year = selectedYear ?? today.getFullYear();
        return dateToCheck.getMonth() === month && dateToCheck.getFullYear() === year;
    }

    if (timeRange === 'YEAR') {
        const year = selectedYear ?? today.getFullYear();
        return dateToCheck.getFullYear() === year;
    }

    return true;
};

/**
 * Converte um objeto Date em uma string 'YYYY-MM-DD' segura para o banco.
 * Utiliza o padrão sueco ('sv') que é idêntico ao ISO YYYY-MM-DD.
 */
export const formatISO = (date: Date): string => {
    return date.toLocaleDateString('sv');
};

/**
 * Formata uma string 'YYYY-MM-DD' para o padrão brasileiro 'DD/MM/YYYY'.
 */
export const formatDisplayDate = (dateStr: string): string => {
    if (!dateStr) return '-';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
};

/**
 * Compara se duas datas (strings ISO) são do mesmo mês e ano.
 */
export const isSameMonth = (dateStrA: string, dateStrB: string): boolean => {
    const dateA = parseISO(dateStrA);
    const dateB = parseISO(dateStrB);
    return dateA.getMonth() === dateB.getMonth() && dateA.getFullYear() === dateB.getFullYear();
};

/**
 * Gera um UUID v4 de forma segura, com fallback para contextos não seguros.
 */
export const getUUID = (): string => {
    try {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return crypto.randomUUID();
        }
    } catch (e) {
        // Silenciosamente falha para o fallback
    }

    // Fallback: Gerador simples de ID único
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

/**
 * Formata um número para moeda brasileira (BRL).
 */
export const formatCurrency = (value: number): string => {
    return Number(value || 0).toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
};
