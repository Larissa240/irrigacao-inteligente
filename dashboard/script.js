// Dashboard - Irrigação Inteligente

const umidadeElemento = document.getElementById("umidade");
const statusElemento = document.getElementById("status");
const botaoIrrigar = document.getElementById("btn-irrigar");

function atualizarDashboard(umidade, irrigando) {
  const valor = Number(umidade);

  if (!Number.isFinite(valor) || valor < 0 || valor > 100) {
    console.warn("Valor de umidade inválido");
    return;
  }

  umidadeElemento.textContent = valor.toFixed(0) + "%";
  statusElemento.textContent = irrigando
    ? "Irrigação ligada"
    : "Irrigação desligada";
}

if (typeof mqtt === "undefined" ||
    typeof MQTT_CONFIG === "undefined") {
  console.log("MQTT ainda não configurado.");
} else {
  const cliente = mqtt.connect(MQTT_CONFIG.brokerUrl, {
    reconnectPeriod: 5000
  });

  cliente.on("connect", () => {
    statusElemento.textContent = "Conectado. Aguardando dados...";
    cliente.subscribe("irrigacao/umidade");
    cliente.subscribe("irrigacao/status");
    botaoIrrigar.disabled = false;
  });

  let umidadeAtual = null;
  let irrigando = false;

  cliente.on("message", (topico, mensagem) => {
    const valor = mensagem.toString();

    if (topico === "irrigacao/umidade") {
      umidadeAtual = Number(valor);
    }

    if (topico === "irrigacao/status") {
      irrigando = valor === "ON";
    }

    if (umidadeAtual !== null) {
      atualizarDashboard(umidadeAtual, irrigando);
    }
  });

  cliente.on("close", () => {
    botaoIrrigar.disabled = true;
    statusElemento.textContent = "Desconectado do MQTT";
  });

  cliente.on("error", (erro) => {
    console.error("Erro MQTT:", erro);
  });

  botaoIrrigar.addEventListener("click", () => {
    if (cliente.connected) {
      cliente.publish("irrigacao/comando", "ON");
    }
  });
}
