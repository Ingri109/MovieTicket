using Microsoft.EntityFrameworkCore;
using MovieTicket.Data;
using Quartz;

namespace MovieTicket.EmailWorker.Jobs;

public class CheckReservationJob : IJob
{
    private readonly IServiceScopeFactory _scopeFactory;

    public CheckReservationJob(IServiceScopeFactory scopeFactory)
    {
        _scopeFactory = scopeFactory;
    }

    public async Task Execute(IJobExecutionContext context)
    {
        var ticketIdString = context.MergedJobDataMap.GetString("TicketId");
        if (!Guid.TryParse(ticketIdString, out var ticketId)) return;

        // Створюємо ізольований Scope для доступу до БД
        using var scope = _scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // Шукаємо квиток і пов'язане з ним місце
        var ticket = await dbContext.Tickets
            .Include(t => t.Seat)
            .FirstOrDefaultAsync(t => t.Id == ticketId);

        // ПЕРЕВІРКА: Якщо квиток знайдено і він досі не оплачений 
        // (Підстав свою властивість. Можливо це ticket.IsPaid == false або ticket.Status == TicketStatus.Reserved)
        if (ticket != null) 
        {
            // 1. Звільняємо місце в залі (якщо у тебе є поле IsAvailable або щось подібне)
            if (ticket.Seat != null)
            {
                // Наприклад: ticket.Seat.IsBooked = false;
            }

            // 2. Видаляємо неоплачений квиток з бази (або міняємо статус на Cancelled)
            dbContext.Tickets.Remove(ticket);

            await dbContext.SaveChangesAsync();
            Console.WriteLine($"[TIMER] Час вийшов. Бронь для квитка {ticketId} автоматично знято.");
        }
    }
}