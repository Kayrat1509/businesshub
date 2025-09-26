import apiService from '../api'; // Единый API слой с автоматическим управлением токенами
import { PaginatedResponse, Tender, TenderFilters } from '../types';

// Интерфейсы для запросов создания и обновления тендеров
export interface CreateTenderRequest {
  title: string; // Название тендера
  description: string; // Подробное описание требований
  categories: number[]; // Массив ID выбранных категорий
  city?: string; // Город поставки (опционально)
  deadline_date?: string; // Крайний срок в формате YYYY-MM-DD (опционально)
  budget_min?: number; // Минимальный бюджет (опционально)
  budget_max?: number; // Максимальный бюджет (опционально)
  // Поле company НЕ отправляется - backend автоматически присваивает request.user.company
}

export interface UpdateTenderRequest extends Partial<CreateTenderRequest> {
  id: number; // ID обновляемого тендера
}

// Ответы API для тендеров
export interface TendersResponse extends PaginatedResponse<Tender> {}

export interface TenderResponse {
  tender: Tender;
  message?: string;
}

/**
 * Сервис для работы с тендерами через единый API слой
 * Все методы автоматически используют Bearer токены и обрабатывают обновление токенов при 401
 * 
 * ВАЖНО: Все URL завершаются слешем (/) для совместимости с Django APPEND_SLASH
 * Без завершающего слеша Django возвращает 500 ошибку при POST запросах
 */
class TenderService {
  private readonly BASE_URL = '/tenders/'; // Базовый URL с завершающим слешем - обязательно для Django APPEND_SLASH

  /**
   * Получить все публичные тендеры (одобренные)
   * GET /api/tenders/ - публичный endpoint, не требует авторизации для просмотра
   */
  async fetchAllTenders(filters?: TenderFilters): Promise<TendersResponse> {
    const params: Record<string, any> = { 
      status: 'APPROVED', // Показываем только одобренные тендеры
      ...filters 
    };
    
    return await apiService.get<TendersResponse>(this.BASE_URL, params);
  }

  /**
   * Получить тендеры конкретной компании по ID
   * GET /api/tenders/?company=<companyId> - фильтрация по компании
   */
  async fetchCompanyTenders(companyId: number, filters?: TenderFilters): Promise<Tender[]> {
    const params: Record<string, any> = { 
      company: companyId, // Ключевой параметр для фильтрации по компании
      status: 'APPROVED', // Показываем только одобренные тендеры
      ...filters 
    };
    
    // Получаем пагинированный ответ и возвращаем только массив результатов
    const response = await apiService.get<TendersResponse>(this.BASE_URL, params);
    return response.results;
  }

  /**
   * Получить тендеры текущего пользователя (все статусы)
   * GET /api/tenders/my/ - приватный endpoint, требует авторизации
   */
  async fetchMyTenders(filters?: TenderFilters): Promise<TendersResponse> {
    const params: Record<string, any> = { ...filters };
    
    // Используем приватный endpoint для получения тендеров пользователя
    return await apiService.get<TendersResponse>(`${this.BASE_URL}my/`, params);
  }

  /**
   * Создать новый тендер
   * POST /api/tenders/ - требует авторизации
   * Компания назначается автоматически на backend через request.user.company
   */
  async createTender(tenderData: CreateTenderRequest): Promise<Tender> {
    // Отправляем данные без поля company - backend автоматически назначит компанию
    return await apiService.post<Tender>(this.BASE_URL, tenderData);
  }

  /**
   * Получить тендер по ID
   * GET /api/tenders/<id>/ - публичный для просмотра
   */
  async getTenderById(tenderId: number): Promise<Tender> {
    return await apiService.get<Tender>(`${this.BASE_URL}${tenderId}/`);
  }

  /**
   * Обновить существующий тендер
   * PUT /api/tenders/<id>/ - требует авторизации и владения тендером
   */
  async updateTender(tenderId: string, tenderData: Omit<CreateTenderRequest, 'id'>): Promise<Tender> {
    // Пробуем обновить тендер через общий endpoint
    return await apiService.put<Tender>(`${this.BASE_URL}${tenderId}/`, tenderData);
  }

  /**
   * Удалить тендер
   * DELETE /api/tenders/<id>/ - требует авторизации и владения тендером
   */
  async deleteTender(tenderId: number): Promise<void> {
    return await apiService.delete<void>(`${this.BASE_URL}${tenderId}/`);
  }

  /**
   * Получить статистику тендеров для дашборда
   * GET /api/tenders/stats/ - требует авторизации
   */
  async getTenderStats(): Promise<{
    total: number;
    active: number;
    pending: number;
    approved: number;
    rejected: number;
  }> {
    return await apiService.get<any>(`${this.BASE_URL}stats/`);
  }
}

// Создаем единственный экземпляр сервиса для всего приложения
// Используется во всех компонентах для обеспечения консистентности
export const tenderService = new TenderService();
export default tenderService;