using MassTransit;
using MailKit.Net.Smtp;
using MimeKit;
using MimeKit.Text;
using MovieTicket.Events;

namespace MovieTicket.EmailWorker;

public class UserRegisteredConsumer : IConsumer<UserRegisteredEvent>
{
    private readonly IConfiguration _config;

    public UserRegisteredConsumer(IConfiguration config)
    {
        _config = config;
    }

    public async Task Consume(ConsumeContext<UserRegisteredEvent> context)
    {
        var data = context.Message;
        
        // Формуємо посилання для підтвердження 
        // ВАЖЛИВО: Заміни порт 5016 на той, на якому працює твій основний API
        var confirmationLink = $"http://localhost:5016/api/auth/confirm-email?token={data.VerificationToken}";

        // 1. Створюємо оболонку листа
        var email = new MimeMessage();
        email.From.Add(new MailboxAddress(
            _config["SmtpSettings:FromName"], 
            _config["SmtpSettings:FromEmail"]));
            
        email.To.Add(new MailboxAddress("", data.Email));
        email.Subject = "Підтвердження реєстрації в MovieTicket";

        // 2. Додаємо HTML тіло листа
        email.Body = new TextPart(TextFormat.Html)
        {
            Text = $@"
                <h2>Вітаємо в нашому кінотеатрі!</h2>
                <p>Щоб завершити реєстрацію та купувати квитки, будь ласка, підтвердіть свою електронну пошту.</p>
                <a href='{confirmationLink}' style='display:inline-block; padding:10px 20px; background-color:#e50914; color:white; text-decoration:none; border-radius:5px;'>
                    Підтвердити Email
                </a>
                <p><br>Якщо кнопка не працює, скопіюйте це посилання у браузер: <br> {confirmationLink}</p>"
        };

        // 3. Відправляємо через SMTP
        using var smtp = new SmtpClient();
        try
        {
            var port = int.Parse(_config["SmtpSettings:Port"]!);
            
            await smtp.ConnectAsync(_config["SmtpSettings:Host"], port, MailKit.Security.SecureSocketOptions.StartTlsWhenAvailable);
            await smtp.AuthenticateAsync(_config["SmtpSettings:Username"], _config["SmtpSettings:Password"]);
            await smtp.SendAsync(email);
            await smtp.DisconnectAsync(true);
            
            Console.WriteLine($"[SUCCESS] Лист підтвердження успішно відправлено на {data.Email}");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[ERROR] Помилка відправки листа: {ex.Message}");
            // Кидаємо виключення далі, щоб MassTransit знав, що повідомлення не оброблено, і спробував ще раз
            throw; 
        }
    }
}