/* =====================================================================
   Bruna Carvalho Beauty — links e eventos
   EDITE AQUI: telefone e mensagens. O resto é automático.
   ===================================================================== */
var CONFIG = {

  // WhatsApp com 55 + DDD, só números
  telefone: "5565992208250",

  // Mensagem que abre no WhatsApp em cada botão
  mensagens: {
    agendar:            "Oi, Bruna! Quero agendar um horário.",
    valores:            "Oi, Bruna! Quero receber a tabela de valores.",

    "volume-natural":   "Oi, Bruna! Quero agendar o Volume Natural.",
    "efeito-rimel":     "Oi, Bruna! Quero agendar o Efeito Rímel.",
    "volume-brasileiro":"Oi, Bruna! Quero agendar o Volume Brasileiro.",
    "volume-elegance":  "Oi, Bruna! Quero agendar o Volume Elegance.",
    "fox-eyes":         "Oi, Bruna! Quero agendar o Fox Eyes.",
    lash:               "Oi, Bruna! Quero agendar o Lash Lifting.",

    design:             "Oi, Bruna! Quero agendar o design de sobrancelhas.",
    henna:              "Oi, Bruna! Quero agendar o design com henna.",
    tintura:            "Oi, Bruna! Quero agendar o design com tintura.",
    "brow-lamination":  "Oi, Bruna! Quero agendar o Brow Lamination.",
    "sense-brows":      "Oi, Bruna! Quero saber sobre a reconstrução Sense Brows.",

    labial:             "Oi, Bruna! Quero agendar a micropigmentação labial.",
    "spa-labial":       "Oi, Bruna! Quero agendar o spa labial."
  },

  links: {
    maps:      "https://maps.google.com/?cid=12128612125764144780",
    instagram: "https://www.instagram.com/bruna.carvalhol/",
    avaliar:   "https://g.page/r/CYzOqt53fFGoEBM/review"
  },

  // utm_source -> texto que entra no fim da mensagem
  origens: {
    instagram: "Vim pelo Instagram",
    google:    "Vim pelo Google",
    gmn:       "Vim pelo Google",
    whatsapp:  "Vim pelo WhatsApp",
    qr:        "Vim pelo QR code",
    impresso:  "Vim pelo catálogo impresso",
    anuncio:   "Vim pelo anúncio",
    facebook:  "Vim pelo Facebook"
  }
};

/* =====================================================================
   Daqui pra baixo não precisa mexer
   ===================================================================== */
(function () {
  "use strict";

  // ---- de onde a pessoa veio ----
  var origem = "";
  try {
    var s = (new URLSearchParams(window.location.search).get("utm_source") || "").toLowerCase().trim();
    if (s) {
      origem = CONFIG.origens[s] || ("Vim por: " + s);
      try { sessionStorage.setItem("bc_origem", origem); } catch (e) {}
    } else {
      try { origem = sessionStorage.getItem("bc_origem") || ""; } catch (e) {}
    }
  } catch (e) {}

  function linkWhats(chave) {
    var msg = CONFIG.mensagens[chave] || CONFIG.mensagens.agendar;
    if (origem) { msg += " (" + origem + ")"; }
    return "https://wa.me/" + CONFIG.telefone + "?text=" + encodeURIComponent(msg);
  }

  // ---- eventos fixos ----
  var EVENTOS = {
    hero:               { padrao: ["Schedule"],    custom: "AgendarWhatsApp" },
    barra:              { padrao: ["Schedule"],    custom: "AgendarWhatsApp" },
    "barra-catalogo":   { padrao: ["Schedule"],    custom: "AgendarWhatsApp" },
    valores:            { padrao: ["ViewContent"], custom: "VerValores" },
    catalogo:           { padrao: ["ViewContent"], custom: "VerCatalogo" },
    rota:               { padrao: [],              custom: "ComoChegar" },
    instagram:          { padrao: [],              custom: "AbrirInstagram" },
    avaliar:            { padrao: [],              custom: "AvaliarGoogle" }
  };

  function camel(slug) {
    return slug.split("-").map(function (parte) {
      return parte.charAt(0).toUpperCase() + parte.slice(1);
    }).join("");
  }

  // "ag-fox-eyes" -> Contact + AgendarFoxEyes
  function resolve(chave) {
    if (!chave) { return null; }
    if (EVENTOS[chave]) { return EVENTOS[chave]; }
    if (chave.indexOf("ver-") === 0) {
      return { padrao: ["ViewContent"], custom: "Ver" + camel(chave.slice(4)) };
    }
    if (chave.indexOf("ag-") === 0) {
      return { padrao: ["Contact"], custom: "Agendar" + camel(chave.slice(3)) };
    }
    return null;
  }

  // ---- Google Ads: conversao "Agendamento WhatsApp" ----
  var GADS = "AW-17940435675/1dOfCOb2oOocENul1epC";
  var TICKET_PADRAO = 170;

  // le o preco do proprio card do procedimento (fonte unica: o HTML)
  function valorDe(chave) {
    if (chave.indexOf("ag-") !== 0) { return TICKET_PADRAO; }
    var bloco = document.querySelector('[data-proc="' + chave.slice(3) + '"] .pv');
    if (!bloco) { return TICKET_PADRAO; }
    // so o texto ANTES do <small> ("R$ 500" e nao "R$ 500" + "3 sessoes")
    var bruto = bloco.firstChild && bloco.firstChild.nodeType === 3
      ? bloco.firstChild.nodeValue
      : bloco.textContent;
    var n = parseInt(String(bruto).replace(/[^0-9]/g, ""), 10);
    return isNaN(n) || n <= 0 ? TICKET_PADRAO : n;
  }

  function ehAgendamento(chave) {
    return chave.indexOf("ag-") === 0 ||
           chave === "hero" || chave === "barra" || chave === "barra-catalogo";
  }

  function disparaGoogle(chave) {
    if (typeof window.gtag !== "function" || !ehAgendamento(chave)) { return; }
    try {
      window.gtag("event", "conversion", {
        send_to: GADS,
        value: valorDe(chave),
        currency: "BRL"
      });
    } catch (err) {}
  }

  function dispara(chave) {
    disparaGoogle(chave);
    var e = resolve(chave);
    if (!e || typeof window.fbq !== "function") { return; }
    var dados = { content_name: chave, origem: origem || "direto" };
    for (var i = 0; i < e.padrao.length; i++) {
      try { window.fbq("track", e.padrao[i], dados); } catch (err) {}
    }
    if (e.custom) {
      try { window.fbq("trackCustom", e.custom, dados); } catch (err) {}
    }
  }

  // ---- monta os links externos ----
  var externos = document.querySelectorAll("[data-wa],[data-link]");
  for (var i = 0; i < externos.length; i++) {
    (function (el) {
      var wa = el.getAttribute("data-wa");
      var lk = el.getAttribute("data-link");
      el.href = wa ? linkWhats(wa) : (CONFIG.links[lk] || "#");
      el.target = "_blank";
      el.rel = "noopener";
      el.addEventListener("click", function () { dispara(el.getAttribute("data-ev")); });
    })(externos[i]);
  }

  // ---- links internos: só o evento ----
  var internos = document.querySelectorAll("a[data-ev]:not([data-wa]):not([data-link])");
  for (var k = 0; k < internos.length; k++) {
    (function (el) {
      el.addEventListener("click", function () { dispara(el.getAttribute("data-ev")); });
    })(internos[k]);
  }

  // ---- lista de procedimentos: um aberto por vez ----
  var lista = document.getElementById("lista");
  if (lista) {
    var itens = lista.querySelectorAll("details.pr");
    for (var n = 0; n < itens.length; n++) {
      (function (item) {
        item.addEventListener("toggle", function () {
          if (!item.open) { return; }
          for (var m = 0; m < itens.length; m++) {
            if (itens[m] !== item) { itens[m].open = false; }
          }
          dispara("ver-" + item.getAttribute("data-proc"));
          // traz o item aberto pra vista, sem sumir com o topo
          var topo = item.getBoundingClientRect().top;
          if (topo < 8 || topo > window.innerHeight * 0.5) {
            window.scrollBy({ top: topo - 90, behavior: "smooth" });
          }
        });
      })(itens[n]);
    }
  }

  // ---- barra fixa ----
  var barra = document.getElementById("sticky");
  var alvo = document.querySelector(".hero .cta") || document.querySelector(".cat-nav");
  if (barra && alvo && "IntersectionObserver" in window) {
    new IntersectionObserver(function (ent) {
      barra.classList.toggle("on", !ent[0].isIntersecting && ent[0].boundingClientRect.top < 0);
    }, { threshold: 0 }).observe(alvo);
  }
})();
