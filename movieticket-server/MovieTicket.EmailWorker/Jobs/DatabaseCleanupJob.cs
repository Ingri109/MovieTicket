using Quartz;
using Microsoft.EntityFrameworkCore;
using MovieTicket.Data;

namespace MovieTicket.EmailWorker.Jobs;

[DisallowConcurrentExecution]
public class DatabaseCleanupJob : IJob
{
    private readonly IServiceScopeFactory _scopeFactory;

    public DatabaseCleanupJob(IServiceScopeFactory scopeFactory)
    {
        _scopeFactory = scopeFactory;
    }

    public async Task Execute(IJobExecutionContext context)
    {
        using var scope = _scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // Знаходимо всіх юзерів, які не підтвердили Email і зареєструвалися більше 24 годин тому
        // (Тут припущено, що в моделі User є поле типу CreatedAt)
        var unconfirmedUsers = await dbContext.Users
            .Where(u => !u.IsEmailConfirmed /* && u.CreatedAt < DateTime.UtcNow.AddDays(-1) */)
            .ToListAsync();

        if (unconfirmedUsers.Any())
        {
            dbContext.Users.RemoveRange(unconfirmedUsers);
            await dbContext.SaveChangesAsync();
            
            Console.WriteLine($"[CRON JOB] Нічне очищення: видалено {unconfirmedUsers.Count} неактивних акаунтів.");
        }
    }
}