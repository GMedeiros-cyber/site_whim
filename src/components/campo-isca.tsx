/**
 * Campo isca contra robôs, para pôr dentro do <form>: pessoas não veem nem chegam nele pelo Tab;
 * robôs costumam preencher. Mande o valor em `site` no enviarContato (a rota ignora o envio).
 */
export function CampoIsca() {
  return (
    <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
      <input type="text" name="site" tabIndex={-1} autoComplete="off" defaultValue="" />
    </div>
  );
}
