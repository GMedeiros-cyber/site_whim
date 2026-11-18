# Celular de 18/11 · testes

Gerado por `scripts/testes-celular.mjs` em 18/11/2026, 18:08:13, contra http://localhost:3417 (antes: http://localhost:3418).
Referência: `referencia/celular-18-11/` (aprovada pelo Gabriel em 18/11). O WhatsApp e o envio do contato são interceptados.

**149 verificações ok e 12 com falha.**

## Falhas

- **Home · menu e barra fixa (âncoras não ficam embaixo da barra)** (Chromium 360): Processo: ao chegar, o menu marca "Clientes" · [print](prints/celular/home-menu-Chromium-360.jpg)
- **Monte · botão flutuante do WhatsApp acima da barra** (Chromium 360): Resumo: o botão flutuante cobre a barra · [print](prints/celular/monte-passo1-Chromium-360.jpg)
- **Home · menu e barra fixa (âncoras não ficam embaixo da barra)** (Chromium 390): Processo: ao chegar, o menu marca "Clientes" · [print](prints/celular/home-menu-Chromium-390.jpg)
- **Monte · Voltar e Continuar no pé da tela** (Chromium 390): Cor: a barra termina em 836 (tela 844) · [print](prints/celular/monte-passo5-Chromium-390.jpg)
- **Home · menu e barra fixa (âncoras não ficam embaixo da barra)** (Chromium 430): Processo: ao chegar, o menu marca "Clientes" · [print](prints/celular/home-menu-Chromium-430.jpg)
- **Monte · Voltar e Continuar no pé da tela** (Chromium 430): Peça: a barra termina em 928 (tela 932); Cor: a barra termina em 924 (tela 932) · [print](prints/celular/monte-passo5-Chromium-430.jpg)
- **Home · menu e barra fixa (âncoras não ficam embaixo da barra)** (WebKit 360): Processo: ao chegar, o menu marca "Clientes" · [print](prints/celular/home-menu-WebKit-360.jpg)
- **Monte · botão flutuante do WhatsApp acima da barra** (WebKit 360): Resumo: o botão flutuante cobre a barra · [print](prints/celular/monte-passo1-WebKit-360.jpg)
- **Home · menu e barra fixa (âncoras não ficam embaixo da barra)** (WebKit 390): Processo: ao chegar, o menu marca "Clientes" · [print](prints/celular/home-menu-WebKit-390.jpg)
- **Monte · Voltar e Continuar no pé da tela** (WebKit 390): Cor: a barra termina em 836 (tela 844) · [print](prints/celular/monte-passo5-WebKit-390.jpg)
- **Home · menu e barra fixa (âncoras não ficam embaixo da barra)** (WebKit 430): Processo: ao chegar, o menu marca "Clientes" · [print](prints/celular/home-menu-WebKit-430.jpg)
- **Monte · Voltar e Continuar no pé da tela** (WebKit 430): Peça: a barra termina em 928 (tela 932); Cor: a barra termina em 924 (tela 932) · [print](prints/celular/monte-passo5-WebKit-430.jpg)

<!-- leitura manual: o script mantém o que estiver entre esta linha e a de fim -->
## Comparação com a referência

Conferido no olho em 18/11/2026, com as três telas aprovadas ao lado do site a 390 px ([home](prints/celular/ref-home.jpg), [Monte sua peça](prints/celular/ref-monte.jpg), [Fale com a Whim](prints/celular/ref-contato.jpg)). As capturas usam movimento reduzido, por isso a faixa de logos dos clientes aparece parada, em grade (igual antes e depois).

**Bate com a referência:** hero com o texto embaixo e um botão; Quem somos só com o vídeo e as etapas 2 × 2; abas Silk | DTF | Bordado com um cartão e as linhas curtas; processo numa linha; dúvidas com 4 e "Ver as 8 perguntas"; rodapé com a Navegação fechada e "Ver no mapa"; no Monte sua peça, a vitrine presa com Frente/Costas e o resumo curto, a linha de passos com a pílula, a pergunta como título do passo e Voltar/Continuar no pé dizendo o próximo passo; no Fale com a Whim, a ordem título → depoimento → formulário → atalhos.

**O que fica diferente ou merece olho (do maior para o menor):**

1. **WebKit sem `OffscreenCanvas` (agente 1):** o WebKit do Playwright não tem `OffscreenCanvas`, e aí a prévia da estampa não mostra o marcador nem a arte, e a ficha do Resumo nunca sai (fica o esqueleto e o "Baixar ficha" desligado), sem aviso. No iPhone com iOS 16.4 ou mais novo o `OffscreenCanvas` existe, então isso deve acontecer só em iOS mais antigo; vale um caminho de reserva ou um aviso. Não é deste pedido (vem da prévia da estampa), mas o celular é onde mais aparece.
2. **Teclado aberto (simulado):** com a tela 45% mais baixa e o campo rolado para o meio, a barra fica no pé e o campo à vista nos passos Cor e Quantidade (a vitrine deixa de ser presa abaixo de 560 px de altura). O Playwright não abre teclado de verdade; no iPhone, a barra presa no pé pode ficar atrás do teclado. Conferir num aparelho.
3. **Botão flutuante do WhatsApp (agente 1):** no Resumo a 360 px, "Pedir orçamento no WhatsApp" quebra em duas linhas, a barra cresce e o botão flutuante encosta nela e cobre o fim do texto do resumo ([print](prints/celular/monte-passo5-Chromium-360.jpg)). Nos outros passos ele fica acima da barra, mas passa por cima de controles ao rolar (o "+" dos tamanhos, a caixa de autorização do Contato). O balão "Oi! Quer um orçamento?" abre 3 s depois da carga em cima das caixas de posição do passo Estampa, numa primeira visita.
4. **Seção atual depois do menu (agente 2):** ao tocar em Processo no menu, a página chega no Processo, mas o menu passa a marcar Clientes (nas 6 combinações). O `site-header.tsx` marca a última seção cujo topo passou de 55% da altura da tela; no celular o Processo ficou curto e o começo de Clientes já passa dessa linha.
5. **Barra de ações nos passos curtos (agente 1):** em Peça (430) e Cor (390 e 430) a barra termina 4 a 8 px acima do pé da tela, e aparece uma faixa do fundo cinza embaixo dela ([print](prints/celular/monte-passo2-Chromium-390.jpg)).
6. **Diferenças de desenho, baixas:**
   - **Monte (agente 1):** o seletor Frente/Costas fica por cima do começo do cano (na referência o cano começa depois dele).
   - **Monte (agente 1):** a posição marcada aparece como o marcador "Sua arte", e não como a área tracejada turquesa da referência.
   - **Contato (agente 1):** o formulário mantém "Empresa ou escola" e o rótulo "Telefone (WhatsApp)" (na referência: "WhatsApp" e sem empresa).
   - **Home (agente 2):** a chamada final "Monte a sua peça." é centralizada e tem o botão branco; na referência é alinhada à esquerda e o botão é turquesa.
   - **Home (agente 2):** o rodapé mantém a descrição e os títulos "Atendimento" e "Endereço", e põe as redes depois dos contatos; na referência a ordem é logo → redes → contatos → Navegação → Ver no mapa.
   - **Home (agente 2):** a 4ª dúvida à vista é "Quais peças e tecidos vocês trabalham?"; na referência é "Vocês atendem a minha região?".
<!-- fim da leitura manual -->

## Celular (360, 390 e 430 px; Chromium e WebKit)

| Verificação | Onde | Resultado | Print |
|---|---|---|---|
| Home · hero | Chromium 360 | ok: texto embaixo, Vista à esquerda, um botão de largura toda e o link Ver o que fazemos | [print](prints/celular/home-hero-Chromium-360.jpg) |
| Home · menu e barra fixa (âncoras não ficam embaixo da barra) | Chromium 360 | **falha**: Processo: ao chegar, o menu marca "Clientes" | [print](prints/celular/home-menu-Chromium-360.jpg) |
| Home · Quem somos | Chromium 360 | ok: vídeo sim, 0 foto(s) do mosaico à vista, 4 etapas em 2 colunas × 2 linhas | [print](prints/celular/home-sobre-Chromium-360.jpg) |
| Home · técnicas (abas, pílula e acordeão) | Chromium 360 | ok: abas por toque e setas, pílula na ativa, um cartão, Confecção e Uniformes abrem, Não sabe qual? abre o WhatsApp | [print](prints/celular/home-tecnicas-Chromium-360.jpg) |
| Home · processo | Chromium 360 | ok: 5 passos numa linha, começa no 1, tocar no 3 mostra só a frase dele | [print](prints/celular/home-processo-Chromium-360.jpg) |
| Home · dúvidas | Chromium 360 | ok: sem foto, 4 perguntas, Ver as 8 perguntas mostra as 8 e o acordeão abre | [print](prints/celular/home-duvidas-Chromium-360.jpg) |
| Rodapé (acordeão e mapa) | Chromium 360 | ok: Navegação fechada que abre, Ver no mapa sem baixar o mapa, Tribus Labs | [print](prints/celular/rodape-Chromium-360.jpg) |
| Home · sem rolagem lateral | Chromium 360 | ok: ok | - |
| Home · alvos de toque ≥ 44 px | Chromium 360 | ok: todos com 44 px ou mais | - |
| Monte · a arara do topo vira o passo 1 | Chromium 360 | ok: a única arara fica no passo Peça, embaixo da vitrine | - |
| Monte · vitrine presa embaixo da barra | Chromium 360 | ok: nos 5 passos, presa embaixo da barra, com 160 a 280 px | [print](prints/celular/monte-passo3-Chromium-360.jpg) |
| Monte · linha de passos (pílula no atual, rola de lado) | Chromium 360 | ok: 5 passos numa linha; o atual marcado e à vista em todos os passos | [print](prints/celular/monte-passo4-Chromium-360.jpg) |
| Monte · só o conteúdo do passo rola | Chromium 360 | ok: ao rolar o passo, a vitrine e a linha de passos ficam no lugar | [print](prints/celular/monte-passo4-Chromium-360.jpg) |
| Monte · Voltar e Continuar no pé da tela | Chromium 360 | ok: nos 5 passos, presos no pé, com "Continuar · próximo passo" e, no Resumo, o WhatsApp | [print](prints/celular/monte-passo5-Chromium-360.jpg) |
| Monte · nada coberto pela vitrine nem pela barra de ações | Chromium 360 | ok: título de cada passo abaixo da vitrine e o fim de cada passo acima da barra | [print](prints/celular/monte-passo2-Chromium-360.jpg) |
| Monte · botão flutuante do WhatsApp acima da barra | Chromium 360 | **falha**: Resumo: o botão flutuante cobre a barra | [print](prints/celular/monte-passo1-Chromium-360.jpg) |
| Monte · sem rolagem lateral | Chromium 360 | ok: nos 5 passos | - |
| Monte · tocar num passo feito volta para ele | Chromium 360 | ok: tocar em Cor abre o passo Cor; Salvar volta ao Resumo | - |
| Monte · Voltar e Continuar com o teclado aberto (simulado) | Chromium 360 | ok: com 45% a menos de altura, a barra fica no pé e o campo em foco aparece entre a vitrine e a barra | [print](prints/celular/monte-teclado-quantidade-Chromium-360.jpg) |
| Monte · alvos de toque ≥ 44 px | Chromium 360 | ok: todos com 44 px ou mais | - |
| Fale com a Whim · ordem e atalhos | Chromium 360 | ok: título, depoimento (sem cartões vazios), formulário e os atalhos de WhatsApp com horário, e-mail e endereço | [print](prints/celular/contato-Chromium-360.jpg) |
| Fale com a Whim · alvos de toque ≥ 44 px | Chromium 360 | ok: todos com 44 px ou mais | - |
| /privacidade · sem rolagem lateral | Chromium 360 | ok: ok | - |
| 404 · sem rolagem lateral | Chromium 360 | ok: ok | - |
| Sem erro no console | Chromium 360 | ok: nenhum | - |
| Home · hero | Chromium 390 | ok: texto embaixo, Vista à esquerda, um botão de largura toda e o link Ver o que fazemos | [print](prints/celular/home-hero-Chromium-390.jpg) |
| Home · menu e barra fixa (âncoras não ficam embaixo da barra) | Chromium 390 | **falha**: Processo: ao chegar, o menu marca "Clientes" | [print](prints/celular/home-menu-Chromium-390.jpg) |
| Home · Quem somos | Chromium 390 | ok: vídeo sim, 0 foto(s) do mosaico à vista, 4 etapas em 2 colunas × 2 linhas | [print](prints/celular/home-sobre-Chromium-390.jpg) |
| Home · técnicas (abas, pílula e acordeão) | Chromium 390 | ok: abas por toque e setas, pílula na ativa, um cartão, Confecção e Uniformes abrem, Não sabe qual? abre o WhatsApp | [print](prints/celular/home-tecnicas-Chromium-390.jpg) |
| Home · processo | Chromium 390 | ok: 5 passos numa linha, começa no 1, tocar no 3 mostra só a frase dele | [print](prints/celular/home-processo-Chromium-390.jpg) |
| Home · dúvidas | Chromium 390 | ok: sem foto, 4 perguntas, Ver as 8 perguntas mostra as 8 e o acordeão abre | [print](prints/celular/home-duvidas-Chromium-390.jpg) |
| Rodapé (acordeão e mapa) | Chromium 390 | ok: Navegação fechada que abre, Ver no mapa sem baixar o mapa, Tribus Labs | [print](prints/celular/rodape-Chromium-390.jpg) |
| Home · sem rolagem lateral | Chromium 390 | ok: ok | - |
| Home · alvos de toque ≥ 44 px | Chromium 390 | ok: todos com 44 px ou mais | - |
| Monte · a arara do topo vira o passo 1 | Chromium 390 | ok: a única arara fica no passo Peça, embaixo da vitrine | - |
| Monte · vitrine presa embaixo da barra | Chromium 390 | ok: nos 5 passos, presa embaixo da barra, com 160 a 280 px | [print](prints/celular/monte-passo3-Chromium-390.jpg) |
| Monte · linha de passos (pílula no atual, rola de lado) | Chromium 390 | ok: 5 passos numa linha; o atual marcado e à vista em todos os passos | [print](prints/celular/monte-passo4-Chromium-390.jpg) |
| Monte · só o conteúdo do passo rola | Chromium 390 | ok: ao rolar o passo, a vitrine e a linha de passos ficam no lugar | [print](prints/celular/monte-passo4-Chromium-390.jpg) |
| Monte · Voltar e Continuar no pé da tela | Chromium 390 | **falha**: Cor: a barra termina em 836 (tela 844) | [print](prints/celular/monte-passo5-Chromium-390.jpg) |
| Monte · nada coberto pela vitrine nem pela barra de ações | Chromium 390 | ok: título de cada passo abaixo da vitrine e o fim de cada passo acima da barra | [print](prints/celular/monte-passo2-Chromium-390.jpg) |
| Monte · botão flutuante do WhatsApp acima da barra | Chromium 390 | ok: o botão flutuante não cobre a barra em nenhum passo | [print](prints/celular/monte-passo1-Chromium-390.jpg) |
| Monte · sem rolagem lateral | Chromium 390 | ok: nos 5 passos | - |
| Monte · tocar num passo feito volta para ele | Chromium 390 | ok: tocar em Cor abre o passo Cor; Salvar volta ao Resumo | - |
| Monte · Voltar e Continuar com o teclado aberto (simulado) | Chromium 390 | ok: com 45% a menos de altura, a barra fica no pé e o campo em foco aparece entre a vitrine e a barra | [print](prints/celular/monte-teclado-quantidade-Chromium-390.jpg) |
| Monte · alvos de toque ≥ 44 px | Chromium 390 | ok: todos com 44 px ou mais | - |
| Fale com a Whim · ordem e atalhos | Chromium 390 | ok: título, depoimento (sem cartões vazios), formulário e os atalhos de WhatsApp com horário, e-mail e endereço | [print](prints/celular/contato-Chromium-390.jpg) |
| Fale com a Whim · alvos de toque ≥ 44 px | Chromium 390 | ok: todos com 44 px ou mais | - |
| /privacidade · sem rolagem lateral | Chromium 390 | ok: ok | - |
| 404 · sem rolagem lateral | Chromium 390 | ok: ok | - |
| Sem erro no console | Chromium 390 | ok: nenhum | - |
| Home · hero | Chromium 430 | ok: texto embaixo, Vista à esquerda, um botão de largura toda e o link Ver o que fazemos | [print](prints/celular/home-hero-Chromium-430.jpg) |
| Home · menu e barra fixa (âncoras não ficam embaixo da barra) | Chromium 430 | **falha**: Processo: ao chegar, o menu marca "Clientes" | [print](prints/celular/home-menu-Chromium-430.jpg) |
| Home · Quem somos | Chromium 430 | ok: vídeo sim, 0 foto(s) do mosaico à vista, 4 etapas em 2 colunas × 2 linhas | [print](prints/celular/home-sobre-Chromium-430.jpg) |
| Home · técnicas (abas, pílula e acordeão) | Chromium 430 | ok: abas por toque e setas, pílula na ativa, um cartão, Confecção e Uniformes abrem, Não sabe qual? abre o WhatsApp | [print](prints/celular/home-tecnicas-Chromium-430.jpg) |
| Home · processo | Chromium 430 | ok: 5 passos numa linha, começa no 1, tocar no 3 mostra só a frase dele | [print](prints/celular/home-processo-Chromium-430.jpg) |
| Home · dúvidas | Chromium 430 | ok: sem foto, 4 perguntas, Ver as 8 perguntas mostra as 8 e o acordeão abre | [print](prints/celular/home-duvidas-Chromium-430.jpg) |
| Rodapé (acordeão e mapa) | Chromium 430 | ok: Navegação fechada que abre, Ver no mapa sem baixar o mapa, Tribus Labs | [print](prints/celular/rodape-Chromium-430.jpg) |
| Home · sem rolagem lateral | Chromium 430 | ok: ok | - |
| Home · alvos de toque ≥ 44 px | Chromium 430 | ok: todos com 44 px ou mais | - |
| Monte · a arara do topo vira o passo 1 | Chromium 430 | ok: a única arara fica no passo Peça, embaixo da vitrine | - |
| Monte · vitrine presa embaixo da barra | Chromium 430 | ok: nos 5 passos, presa embaixo da barra, com 160 a 280 px | [print](prints/celular/monte-passo3-Chromium-430.jpg) |
| Monte · linha de passos (pílula no atual, rola de lado) | Chromium 430 | ok: 5 passos numa linha; o atual marcado e à vista em todos os passos | [print](prints/celular/monte-passo4-Chromium-430.jpg) |
| Monte · só o conteúdo do passo rola | Chromium 430 | ok: ao rolar o passo, a vitrine e a linha de passos ficam no lugar | [print](prints/celular/monte-passo4-Chromium-430.jpg) |
| Monte · Voltar e Continuar no pé da tela | Chromium 430 | **falha**: Peça: a barra termina em 928 (tela 932); Cor: a barra termina em 924 (tela 932) | [print](prints/celular/monte-passo5-Chromium-430.jpg) |
| Monte · nada coberto pela vitrine nem pela barra de ações | Chromium 430 | ok: título de cada passo abaixo da vitrine e o fim de cada passo acima da barra | [print](prints/celular/monte-passo2-Chromium-430.jpg) |
| Monte · botão flutuante do WhatsApp acima da barra | Chromium 430 | ok: o botão flutuante não cobre a barra em nenhum passo | [print](prints/celular/monte-passo1-Chromium-430.jpg) |
| Monte · sem rolagem lateral | Chromium 430 | ok: nos 5 passos | - |
| Monte · tocar num passo feito volta para ele | Chromium 430 | ok: tocar em Cor abre o passo Cor; Salvar volta ao Resumo | - |
| Monte · Voltar e Continuar com o teclado aberto (simulado) | Chromium 430 | ok: com 45% a menos de altura, a barra fica no pé e o campo em foco aparece entre a vitrine e a barra | [print](prints/celular/monte-teclado-quantidade-Chromium-430.jpg) |
| Monte · alvos de toque ≥ 44 px | Chromium 430 | ok: todos com 44 px ou mais | - |
| Fale com a Whim · ordem e atalhos | Chromium 430 | ok: título, depoimento (sem cartões vazios), formulário e os atalhos de WhatsApp com horário, e-mail e endereço | [print](prints/celular/contato-Chromium-430.jpg) |
| Fale com a Whim · alvos de toque ≥ 44 px | Chromium 430 | ok: todos com 44 px ou mais | - |
| /privacidade · sem rolagem lateral | Chromium 430 | ok: ok | - |
| 404 · sem rolagem lateral | Chromium 430 | ok: ok | - |
| Sem erro no console | Chromium 430 | ok: nenhum | - |
| Home · hero | WebKit 360 | ok: texto embaixo, Vista à esquerda, um botão de largura toda e o link Ver o que fazemos | [print](prints/celular/home-hero-WebKit-360.jpg) |
| Home · menu e barra fixa (âncoras não ficam embaixo da barra) | WebKit 360 | **falha**: Processo: ao chegar, o menu marca "Clientes" | [print](prints/celular/home-menu-WebKit-360.jpg) |
| Home · Quem somos | WebKit 360 | ok: vídeo sim, 0 foto(s) do mosaico à vista, 4 etapas em 2 colunas × 2 linhas | [print](prints/celular/home-sobre-WebKit-360.jpg) |
| Home · técnicas (abas, pílula e acordeão) | WebKit 360 | ok: abas por toque e setas, pílula na ativa, um cartão, Confecção e Uniformes abrem, Não sabe qual? abre o WhatsApp | [print](prints/celular/home-tecnicas-WebKit-360.jpg) |
| Home · processo | WebKit 360 | ok: 5 passos numa linha, começa no 1, tocar no 3 mostra só a frase dele | [print](prints/celular/home-processo-WebKit-360.jpg) |
| Home · dúvidas | WebKit 360 | ok: sem foto, 4 perguntas, Ver as 8 perguntas mostra as 8 e o acordeão abre | [print](prints/celular/home-duvidas-WebKit-360.jpg) |
| Rodapé (acordeão e mapa) | WebKit 360 | ok: Navegação fechada que abre, Ver no mapa sem baixar o mapa, Tribus Labs | [print](prints/celular/rodape-WebKit-360.jpg) |
| Home · sem rolagem lateral | WebKit 360 | ok: ok | - |
| Home · alvos de toque ≥ 44 px | WebKit 360 | ok: todos com 44 px ou mais | - |
| Monte · a arara do topo vira o passo 1 | WebKit 360 | ok: a única arara fica no passo Peça, embaixo da vitrine | - |
| Monte · vitrine presa embaixo da barra | WebKit 360 | ok: nos 5 passos, presa embaixo da barra, com 160 a 280 px | [print](prints/celular/monte-passo3-WebKit-360.jpg) |
| Monte · linha de passos (pílula no atual, rola de lado) | WebKit 360 | ok: 5 passos numa linha; o atual marcado e à vista em todos os passos | [print](prints/celular/monte-passo4-WebKit-360.jpg) |
| Monte · só o conteúdo do passo rola | WebKit 360 | ok: ao rolar o passo, a vitrine e a linha de passos ficam no lugar | [print](prints/celular/monte-passo4-WebKit-360.jpg) |
| Monte · Voltar e Continuar no pé da tela | WebKit 360 | ok: nos 5 passos, presos no pé, com "Continuar · próximo passo" e, no Resumo, o WhatsApp | [print](prints/celular/monte-passo5-WebKit-360.jpg) |
| Monte · nada coberto pela vitrine nem pela barra de ações | WebKit 360 | ok: título de cada passo abaixo da vitrine e o fim de cada passo acima da barra | [print](prints/celular/monte-passo2-WebKit-360.jpg) |
| Monte · botão flutuante do WhatsApp acima da barra | WebKit 360 | **falha**: Resumo: o botão flutuante cobre a barra | [print](prints/celular/monte-passo1-WebKit-360.jpg) |
| Monte · sem rolagem lateral | WebKit 360 | ok: nos 5 passos | - |
| Monte · tocar num passo feito volta para ele | WebKit 360 | ok: tocar em Cor abre o passo Cor; Salvar volta ao Resumo | - |
| Monte · Voltar e Continuar com o teclado aberto (simulado) | WebKit 360 | ok: com 45% a menos de altura, a barra fica no pé e o campo em foco aparece entre a vitrine e a barra | [print](prints/celular/monte-teclado-quantidade-WebKit-360.jpg) |
| Monte · alvos de toque ≥ 44 px | WebKit 360 | ok: todos com 44 px ou mais | - |
| Fale com a Whim · ordem e atalhos | WebKit 360 | ok: título, depoimento (sem cartões vazios), formulário e os atalhos de WhatsApp com horário, e-mail e endereço | [print](prints/celular/contato-WebKit-360.jpg) |
| Fale com a Whim · alvos de toque ≥ 44 px | WebKit 360 | ok: todos com 44 px ou mais | - |
| /privacidade · sem rolagem lateral | WebKit 360 | ok: ok | - |
| 404 · sem rolagem lateral | WebKit 360 | ok: ok | - |
| Sem erro no console | WebKit 360 | ok: nenhum | - |
| Home · hero | WebKit 390 | ok: texto embaixo, Vista à esquerda, um botão de largura toda e o link Ver o que fazemos | [print](prints/celular/home-hero-WebKit-390.jpg) |
| Home · menu e barra fixa (âncoras não ficam embaixo da barra) | WebKit 390 | **falha**: Processo: ao chegar, o menu marca "Clientes" | [print](prints/celular/home-menu-WebKit-390.jpg) |
| Home · Quem somos | WebKit 390 | ok: vídeo sim, 0 foto(s) do mosaico à vista, 4 etapas em 2 colunas × 2 linhas | [print](prints/celular/home-sobre-WebKit-390.jpg) |
| Home · técnicas (abas, pílula e acordeão) | WebKit 390 | ok: abas por toque e setas, pílula na ativa, um cartão, Confecção e Uniformes abrem, Não sabe qual? abre o WhatsApp | [print](prints/celular/home-tecnicas-WebKit-390.jpg) |
| Home · processo | WebKit 390 | ok: 5 passos numa linha, começa no 1, tocar no 3 mostra só a frase dele | [print](prints/celular/home-processo-WebKit-390.jpg) |
| Home · dúvidas | WebKit 390 | ok: sem foto, 4 perguntas, Ver as 8 perguntas mostra as 8 e o acordeão abre | [print](prints/celular/home-duvidas-WebKit-390.jpg) |
| Rodapé (acordeão e mapa) | WebKit 390 | ok: Navegação fechada que abre, Ver no mapa sem baixar o mapa, Tribus Labs | [print](prints/celular/rodape-WebKit-390.jpg) |
| Home · sem rolagem lateral | WebKit 390 | ok: ok | - |
| Home · alvos de toque ≥ 44 px | WebKit 390 | ok: todos com 44 px ou mais | - |
| Monte · a arara do topo vira o passo 1 | WebKit 390 | ok: a única arara fica no passo Peça, embaixo da vitrine | - |
| Monte · vitrine presa embaixo da barra | WebKit 390 | ok: nos 5 passos, presa embaixo da barra, com 160 a 280 px | [print](prints/celular/monte-passo3-WebKit-390.jpg) |
| Monte · linha de passos (pílula no atual, rola de lado) | WebKit 390 | ok: 5 passos numa linha; o atual marcado e à vista em todos os passos | [print](prints/celular/monte-passo4-WebKit-390.jpg) |
| Monte · só o conteúdo do passo rola | WebKit 390 | ok: ao rolar o passo, a vitrine e a linha de passos ficam no lugar | [print](prints/celular/monte-passo4-WebKit-390.jpg) |
| Monte · Voltar e Continuar no pé da tela | WebKit 390 | **falha**: Cor: a barra termina em 836 (tela 844) | [print](prints/celular/monte-passo5-WebKit-390.jpg) |
| Monte · nada coberto pela vitrine nem pela barra de ações | WebKit 390 | ok: título de cada passo abaixo da vitrine e o fim de cada passo acima da barra | [print](prints/celular/monte-passo2-WebKit-390.jpg) |
| Monte · botão flutuante do WhatsApp acima da barra | WebKit 390 | ok: o botão flutuante não cobre a barra em nenhum passo | [print](prints/celular/monte-passo1-WebKit-390.jpg) |
| Monte · sem rolagem lateral | WebKit 390 | ok: nos 5 passos | - |
| Monte · tocar num passo feito volta para ele | WebKit 390 | ok: tocar em Cor abre o passo Cor; Salvar volta ao Resumo | - |
| Monte · Voltar e Continuar com o teclado aberto (simulado) | WebKit 390 | ok: com 45% a menos de altura, a barra fica no pé e o campo em foco aparece entre a vitrine e a barra | [print](prints/celular/monte-teclado-quantidade-WebKit-390.jpg) |
| Monte · alvos de toque ≥ 44 px | WebKit 390 | ok: todos com 44 px ou mais | - |
| Fale com a Whim · ordem e atalhos | WebKit 390 | ok: título, depoimento (sem cartões vazios), formulário e os atalhos de WhatsApp com horário, e-mail e endereço | [print](prints/celular/contato-WebKit-390.jpg) |
| Fale com a Whim · alvos de toque ≥ 44 px | WebKit 390 | ok: todos com 44 px ou mais | - |
| /privacidade · sem rolagem lateral | WebKit 390 | ok: ok | - |
| 404 · sem rolagem lateral | WebKit 390 | ok: ok | - |
| Sem erro no console | WebKit 390 | ok: nenhum | - |
| Home · hero | WebKit 430 | ok: texto embaixo, Vista à esquerda, um botão de largura toda e o link Ver o que fazemos | [print](prints/celular/home-hero-WebKit-430.jpg) |
| Home · menu e barra fixa (âncoras não ficam embaixo da barra) | WebKit 430 | **falha**: Processo: ao chegar, o menu marca "Clientes" | [print](prints/celular/home-menu-WebKit-430.jpg) |
| Home · Quem somos | WebKit 430 | ok: vídeo sim, 0 foto(s) do mosaico à vista, 4 etapas em 2 colunas × 2 linhas | [print](prints/celular/home-sobre-WebKit-430.jpg) |
| Home · técnicas (abas, pílula e acordeão) | WebKit 430 | ok: abas por toque e setas, pílula na ativa, um cartão, Confecção e Uniformes abrem, Não sabe qual? abre o WhatsApp | [print](prints/celular/home-tecnicas-WebKit-430.jpg) |
| Home · processo | WebKit 430 | ok: 5 passos numa linha, começa no 1, tocar no 3 mostra só a frase dele | [print](prints/celular/home-processo-WebKit-430.jpg) |
| Home · dúvidas | WebKit 430 | ok: sem foto, 4 perguntas, Ver as 8 perguntas mostra as 8 e o acordeão abre | [print](prints/celular/home-duvidas-WebKit-430.jpg) |
| Rodapé (acordeão e mapa) | WebKit 430 | ok: Navegação fechada que abre, Ver no mapa sem baixar o mapa, Tribus Labs | [print](prints/celular/rodape-WebKit-430.jpg) |
| Home · sem rolagem lateral | WebKit 430 | ok: ok | - |
| Home · alvos de toque ≥ 44 px | WebKit 430 | ok: todos com 44 px ou mais | - |
| Monte · a arara do topo vira o passo 1 | WebKit 430 | ok: a única arara fica no passo Peça, embaixo da vitrine | - |
| Monte · vitrine presa embaixo da barra | WebKit 430 | ok: nos 5 passos, presa embaixo da barra, com 160 a 280 px | [print](prints/celular/monte-passo3-WebKit-430.jpg) |
| Monte · linha de passos (pílula no atual, rola de lado) | WebKit 430 | ok: 5 passos numa linha; o atual marcado e à vista em todos os passos | [print](prints/celular/monte-passo4-WebKit-430.jpg) |
| Monte · só o conteúdo do passo rola | WebKit 430 | ok: ao rolar o passo, a vitrine e a linha de passos ficam no lugar | [print](prints/celular/monte-passo4-WebKit-430.jpg) |
| Monte · Voltar e Continuar no pé da tela | WebKit 430 | **falha**: Peça: a barra termina em 928 (tela 932); Cor: a barra termina em 924 (tela 932) | [print](prints/celular/monte-passo5-WebKit-430.jpg) |
| Monte · nada coberto pela vitrine nem pela barra de ações | WebKit 430 | ok: título de cada passo abaixo da vitrine e o fim de cada passo acima da barra | [print](prints/celular/monte-passo2-WebKit-430.jpg) |
| Monte · botão flutuante do WhatsApp acima da barra | WebKit 430 | ok: o botão flutuante não cobre a barra em nenhum passo | [print](prints/celular/monte-passo1-WebKit-430.jpg) |
| Monte · sem rolagem lateral | WebKit 430 | ok: nos 5 passos | - |
| Monte · tocar num passo feito volta para ele | WebKit 430 | ok: tocar em Cor abre o passo Cor; Salvar volta ao Resumo | - |
| Monte · Voltar e Continuar com o teclado aberto (simulado) | WebKit 430 | ok: com 45% a menos de altura, a barra fica no pé e o campo em foco aparece entre a vitrine e a barra | [print](prints/celular/monte-teclado-quantidade-WebKit-430.jpg) |
| Monte · alvos de toque ≥ 44 px | WebKit 430 | ok: todos com 44 px ou mais | - |
| Fale com a Whim · ordem e atalhos | WebKit 430 | ok: título, depoimento (sem cartões vazios), formulário e os atalhos de WhatsApp com horário, e-mail e endereço | [print](prints/celular/contato-WebKit-430.jpg) |
| Fale com a Whim · alvos de toque ≥ 44 px | WebKit 430 | ok: todos com 44 px ou mais | - |
| /privacidade · sem rolagem lateral | WebKit 430 | ok: ok | - |
| 404 · sem rolagem lateral | WebKit 430 | ok: ok | - |
| Sem erro no console | WebKit 430 | ok: nenhum | - |

## Referência ao lado do site

| Verificação | Onde | Resultado | Print |
|---|---|---|---|
| Home ao lado da referência | 390 | ok: comparação no olho: ver a leitura manual | [print](prints/celular/ref-home.jpg) |
| Monte sua peça ao lado da referência | 390 | ok: comparação no olho: ver a leitura manual | [print](prints/celular/ref-monte.jpg) |
| Fale com a Whim ao lado da referência | 390 | ok: comparação no olho: ver a leitura manual | [print](prints/celular/ref-contato.jpg) |

## PC: 1280 e 1920, antes e depois

| Verificação | Onde | Resultado | Print |
|---|---|---|---|
| home igual ao de antes | 1280 | ok: igual (0.000% de pixels diferentes, abaixo de 0,05%) | [print](prints/celular/pc-1280-home-depois.jpg) |
| monte igual ao de antes | 1280 | ok: igual (0.000% de pixels diferentes, abaixo de 0,05%) | [print](prints/celular/pc-1280-monte-depois.jpg) |
| privacidade igual ao de antes | 1280 | ok: igual (0.000% de pixels diferentes, abaixo de 0,05%) | [print](prints/celular/pc-1280-privacidade-depois.jpg) |
| 404 igual ao de antes | 1280 | ok: igual (0.000% de pixels diferentes, abaixo de 0,05%) | [print](prints/celular/pc-1280-404-depois.jpg) |
| home igual ao de antes | 1920 | ok: igual (0.000% de pixels diferentes, abaixo de 0,05%) | [print](prints/celular/pc-1920-home-depois.jpg) |
| monte igual ao de antes | 1920 | ok: igual (0.000% de pixels diferentes, abaixo de 0,05%) | [print](prints/celular/pc-1920-monte-depois.jpg) |
| privacidade igual ao de antes | 1920 | ok: igual (0.000% de pixels diferentes, abaixo de 0,05%) | [print](prints/celular/pc-1920-privacidade-depois.jpg) |
| 404 igual ao de antes | 1920 | ok: igual (0.000% de pixels diferentes, abaixo de 0,05%) | [print](prints/celular/pc-1920-404-depois.jpg) |
