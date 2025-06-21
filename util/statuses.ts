export enum statuses {
    ACTIVE = 'active',
    COMPLETED = 'completed',
    DEVELOPMENT = 'development',
    MAINTENANCE = 'maintenance',
    STOPPED = 'stopped'
}
export function getStatusText(status: statuses) {
    switch (status) {
        case statuses.ACTIVE:
            return 'Активный'
        case statuses.COMPLETED:
            return 'Завершен'
        case statuses.DEVELOPMENT:
            return 'В разработке'
        case statuses.MAINTENANCE:
            return 'Поддержка'
        case statuses.STOPPED:
            return 'Заморожен'
        default:
            return 'Неизвестный статус'
    }
}
