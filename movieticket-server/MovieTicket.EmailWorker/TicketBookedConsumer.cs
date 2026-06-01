using MassTransit;
using MovieTicket.Events;
using Quartz;
using MovieTicket.EmailWorker.Jobs;

namespace MovieTicket.EmailWorker;

public class TicketBookedConsumer : IConsumer<TicketBookedEvent>
{
    private readonly ISchedulerFactory _schedulerFactory;

    // Інжектуємо фабрику планувальника Quartz
    public TicketBookedConsumer(ISchedulerFactory schedulerFactory)
    {
        _schedulerFactory = schedulerFactory;
    }

    public async Task Consume(ConsumeContext<TicketBookedEvent> context)
    {
        var data = context.Message;
        Console.WriteLine($"[RabbitMQ] Отримано квиток {data.TicketId}. Створюємо таймер броні...");

        // Отримуємо сам планувальник
        var scheduler = await _schedulerFactory.GetScheduler();

        // 1. Описуємо задачу, передаючи всередину ID квитка
        var job = JobBuilder.Create<CheckReservationJob>()
            .WithIdentity($"CheckReservation_{data.TicketId}", "Reservations")
            .UsingJobData("TicketId", data.TicketId.ToString())
            .Build();

        // 2. Створюємо тригер, який вистрілить РІВНО через 15 хвилин (для тесту поставимо 20 секунд)
        var trigger = TriggerBuilder.Create()
            .WithIdentity($"Trigger_{data.TicketId}", "Reservations")
            .StartAt(DateTimeOffset.UtcNow.AddMinutes(15)) // Зміни на .AddMinutes(15) для реального сайту
            .Build();

        // 3. Реєструємо задачу в пам'яті Quartz
        await scheduler.ScheduleJob(job, trigger);
        
        // ... тут залишається твій старий код відправки Email з квитком ...
    }
}