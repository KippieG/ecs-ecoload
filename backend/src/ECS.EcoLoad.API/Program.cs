using ECS.EcoLoad.Hubs;
using ECS.EcoLoad.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "ECS EcoLoad & Temp Optimizer API", Version = "v1" });
});

builder.Services.AddSignalR();
builder.Services.AddSingleton<ReeferStore>();
builder.Services.AddSingleton<ConsolidationEngine>();
builder.Services.AddHostedService<ReeferSimulator>();

builder.Services.AddCors(opt => opt.AddDefaultPolicy(p =>
    p.WithOrigins("http://localhost:4200")
     .AllowAnyHeader()
     .AllowAnyMethod()
     .AllowCredentials()));

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "ECS EcoLoad API v1"));

app.UseCors();
app.UseAuthorization();
app.MapControllers();
app.MapHub<ReeferHub>("/hubs/reefer");

app.Run();
