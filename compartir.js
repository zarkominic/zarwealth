// compartir.js — lo que necesita JavaScript en los botones de compartir y en
// «¿Te ha sido útil?» (ver compartir.py). Sin JavaScript los enlaces a cada
// red siguen funcionando; esto solo añade copiar, el menú del móvil, enviar
// la opinión y contar los clics en GA4.
(function () {
  "use strict";
  var cuenta = function (evento, datos) {
    if (typeof window.gtag === "function") window.gtag("event", evento, datos);
  };
  var pagina = location.pathname;

  document.querySelectorAll(".compartir").forEach(function (caja) {
    var url = caja.getAttribute("data-url");
    var titulo = caja.getAttribute("data-titulo");

    caja.querySelectorAll("a[data-red]").forEach(function (a) {
      a.addEventListener("click", function () {
        cuenta("share", { method: a.getAttribute("data-red"), content_type: "article", item_id: pagina });
      });
    });

    var copiar = caja.querySelector("[data-copiar]");
    if (copiar && navigator.clipboard) {
      copiar.parentElement.hidden = false;
      var rotulo = copiar.getAttribute("aria-label");
      copiar.addEventListener("click", function () {
        navigator.clipboard.writeText(url).then(function () {
          copiar.classList.add("hecho");
          copiar.setAttribute("aria-label", copiar.getAttribute("data-hecho"));
          copiar.setAttribute("title", copiar.getAttribute("data-hecho"));
          cuenta("share", { method: "copy_link", content_type: "article", item_id: pagina });
          setTimeout(function () {
            copiar.classList.remove("hecho");
            copiar.setAttribute("aria-label", rotulo);
            copiar.setAttribute("title", rotulo);
          }, 2200);
        });
      });
    }

    // el menú de compartir del teléfono: solo donde existe y en pantallas táctiles
    var nativo = caja.querySelector("[data-nativo]");
    if (nativo && navigator.share && matchMedia("(pointer: coarse)").matches) {
      nativo.parentElement.hidden = false;
      nativo.addEventListener("click", function () {
        navigator.share({ title: titulo, url: url }).then(function () {
          cuenta("share", { method: "native", content_type: "article", item_id: pagina });
        }).catch(function () {});
      });
    }
  });

  var forma = document.querySelector("form.opinion");
  if (!forma || !window.fetch) return;
  forma.hidden = false;
  var destino = forma.getAttribute("data-destino");
  var estado = forma.querySelector(".opinion-estado");
  var mas = forma.querySelector(".opinion-mas");
  var util = null;

  var envia = function (datos) {
    return fetch(destino, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos),
    }).then(function (r) {
      if (!r.ok) throw new Error(r.status);
    });
  };

  forma.querySelectorAll(".boton-voto").forEach(function (b) {
    b.addEventListener("click", function () {
      util = Number(b.getAttribute("data-util"));
      forma.querySelectorAll(".boton-voto").forEach(function (o) {
        o.setAttribute("aria-pressed", o === b ? "true" : "false");
      });
      mas.hidden = false;
      estado.textContent = "";
      cuenta("articulo_util", { valor: util ? "si" : "no", item_id: pagina });
      envia({ pagina: forma.getAttribute("data-pagina"), util: util }).catch(function () {});
    });
  });

  forma.addEventListener("submit", function (ev) {
    ev.preventDefault();
    if (util === null) return;
    var texto = forma.querySelector("textarea").value.trim();
    var boton = forma.querySelector(".boton-enviar");
    boton.disabled = true;
    envia({
      pagina: forma.getAttribute("data-pagina"),
      util: util,
      texto: texto,
      web: forma.querySelector(".opinion-trampa input").value,
    }).then(function () {
      mas.hidden = true;
      forma.querySelector(".opinion-voto").disabled = true;
      estado.textContent = forma.getAttribute("data-gracias");
    }).catch(function () {
      boton.disabled = false;
      estado.textContent = forma.getAttribute("data-error");
    });
  });
})();
