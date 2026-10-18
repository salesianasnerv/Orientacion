import Link from "next/link";
import { activarCurso, asignarTutor, borrarPersona, guardarPersona, sincronizar } from "@/app/acciones";
import { Chip, Marco } from "@/components/Marco";
import { nombreGrupo, type CursoAcademico, type Grupo } from "@/lib/datos";
import { listarCarpeta, sharepointConfigurado } from "@/lib/sharepoint";
import { createClient, obtenerPerfil } from "@/lib/supabase/server";

type Persona = { id: string; email: string; nombre: string; nombre_seneca: string | null; rol: "orientacion" | "docente"; activo: boolean };

const SECCIONES = { perfiles: "Perfiles", cursos: "Cursos y grupos" } as const;
type Seccion = keyof typeof SECCIONES;

export default async function Administracion({
  searchParams,
}: {
  searchParams: Promise<{ seccion?: string; ok?: string; error?: string; sin?: string }>;
}) {
  const perfil = await obtenerPerfil();
  const { seccion: s, ok, error, sin } = await searchParams;
  if (perfil?.rol !== "orientacion") {
    return (
      <Marco perfil={perfil} pestana="admin">
        <div className="panel"><h2 className="naranja">Solo Orientación</h2><p>Esta sección es solo para el Departamento de Orientación.</p></div>
      </Marco>
    );
  }
  const seccion: Seccion = s === "cursos" ? "cursos" : "perfiles";
  const supabase = await createClient();
  const [{ data: personal }, { data: cursos }] = await Promise.all([
    supabase.from("personal").select("id, email, nombre, nombre_seneca, rol, activo").order("rol").order("nombre").returns<Persona[]>(),
    supabase.from("curso_academico").select("id, nombre, activo").order("nombre", { ascending: false }).returns<CursoAcademico[]>(),
  ]);
  const activo = cursos?.find((c) => c.activo);
  const sharepoint = !sharepointConfigurado() ? "sin" : (await listarCarpeta("Recursos")) ? "ok" : "error";

  return (
    <Marco perfil={perfil} curso={activo?.nombre} pestana="admin" migas={<>Administración › <b>{SECCIONES[seccion]}</b></>}>
      <div className="barra">
        {Object.entries(SECCIONES).map(([k, v]) => (
          <Link key={k} href={`/admin?seccion=${k}`} className={`btn ${k === seccion ? "pri" : ""}`}>{v}</Link>
        ))}
      </div>
      {ok && <div className="aviso info">{ok}</div>}
      {sin && <div className="aviso">Sin grupo en el curso activo (bajas, cambio de etapa o nombre distinto en Séneca): {sin}</div>}
      {error && <div className="aviso error">{error}</div>}

      <div className={`aviso ${sharepoint === "ok" ? "info" : sharepoint === "error" ? "error" : ""}`}>
        <b>SharePoint en directo:</b>{" "}
        {sharepoint === "ok" && "conectado. Recursos, Plantillas, Proceso de derivación y las plantillas del documento de seguimiento se leen de SharePoint (los cambios se ven en unos 5 minutos)."}
        {sharepoint === "sin" && "sin configurar. La web usa sus listas fijas. Pasos en docs/guia-sharepoint-en-directo.md."}
        {sharepoint === "error" && "configurado, pero Microsoft no da acceso. Revisa los permisos y el secreto (docs/guia-sharepoint-en-directo.md)."}
      </div>
      {seccion === "perfiles" ? <Perfiles personal={personal ?? []} miEmail={perfil.email} /> : <Cursos cursos={cursos ?? []} personal={personal ?? []} />}
    </Marco>
  );
}

function Perfiles({ personal, miEmail }: { personal: Persona[]; miEmail: string | null }) {
  return (
    <>
      <section className="panel">
        <h2>Perfiles</h2>
        <p className="sub">
          <b>Orientación</b>: edición completa y administración. <b>Docente</b>: si es tutor/a de un grupo del curso activo, edita las fichas de su grupo; si no, consulta.
          Cualquier otra cuenta @salesianas.org entra en consulta sin estar aquí. El <b>nombre en Séneca</b> («Apellidos, Nombre») sirve para asignar las tutorías al sincronizar.
        </p>
        <div className="tabla-wrap">
          <table className="datos">
            <thead>
              <tr><th>Nombre</th><th>Email</th><th>Nombre en Séneca</th><th>Perfil</th><th>Activo</th><th /></tr>
            </thead>
            <tbody>
              {personal.map((p) => {
                const formId = `p-${p.id}`;
                return (
                  <tr key={p.id}>
                    <td><input form={formId} type="text" name="nombre" defaultValue={p.nombre} required /></td>
                    <td><input form={formId} type="email" name="email" defaultValue={p.email} required /></td>
                    <td><input form={formId} type="text" name="nombre_seneca" defaultValue={p.nombre_seneca ?? ""} placeholder="Apellidos, Nombre" /></td>
                    <td>
                      <select form={formId} name="rol" defaultValue={p.rol}>
                        <option value="orientacion">Orientación</option>
                        <option value="docente">Docente</option>
                      </select>
                    </td>
                    <td style={{ textAlign: "center" }}><input form={formId} type="checkbox" name="activo" defaultChecked={p.activo} /></td>
                    <td>
                      <div className="chips" style={{ flexWrap: "nowrap" }}>
                        <form id={formId} action={guardarPersona}>
                          <input type="hidden" name="id" value={p.id} />
                          <button className="btn mini pri">Guardar</button>
                        </form>
                        {p.email.toLowerCase() !== miEmail?.toLowerCase() && (
                          <form action={borrarPersona}>
                            <input type="hidden" name="id" value={p.id} />
                            <button className="btn mini peligro" title="Eliminar perfil">Eliminar</button>
                          </form>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <form action={guardarPersona} className="panel">
        <h2 className="verde">Añadir perfil</h2>
        <div className="form-grid">
          <label className="campo">Nombre y apellidos<input type="text" name="nombre" required /></label>
          <label className="campo">Email<input type="email" name="email" placeholder="nombre.apellido@salesianas.org" required /></label>
          <label className="campo">Nombre en Séneca (si es tutor/a)<input type="text" name="nombre_seneca" placeholder="Apellidos, Nombre" /></label>
          <label className="campo">Perfil
            <select name="rol" defaultValue="docente">
              <option value="docente">Docente / tutor/a</option>
              <option value="orientacion">Orientación</option>
            </select>
          </label>
        </div>
        <div className="fila-botones" style={{ marginTop: 12 }}><button className="btn pri">Añadir</button></div>
      </form>
    </>
  );
}

async function Cursos({ cursos, personal }: { cursos: CursoAcademico[]; personal: Persona[] }) {
  const supabase = await createClient();
  const { data: grupos } = await supabase
    .from("grupo")
    .select("id, letra, curso_academico_id, nivel:nivel_id(nombre, orden), tutor:tutor_id(nombre, email), tutor_id")
    .returns<(Grupo & { tutor_id: string | null })[]>();
  const activos = personal.filter((p) => p.activo);

  return (
    <>
      <section className="panel">
        <h2 className="verde">Sincronizar con «Acceso a Microsoft 365»</h2>
        <p className="sub">
          Las listas de clase son las comunes de la base de datos «Acceso a Microsoft 365», la que comparten todas las webs del colegio (se cargan con los PDF de Séneca). Al sincronizar, Orientación toma su
          <b> curso activo</b>: lo crea aquí y lo marca como activo, crea los grupos de ESO, asigna cada tutoría por el nombre en Séneca y coloca en su
          grupo al alumnado en seguimiento. Se puede repetir sin duplicar nada. Hazlo cada septiembre y tras cambios de lista.
        </p>
        <form action={sincronizar}><button className="btn pri">Sincronizar ahora</button></form>
      </section>

      {cursos.map((c) => {
        const delCurso = (grupos ?? [])
          .filter((g) => g.curso_academico_id === c.id)
          .sort((a, b) => (a.nivel?.orden ?? 0) - (b.nivel?.orden ?? 0) || a.letra.localeCompare(b.letra));
        return (
          <section key={c.id} className="panel">
            <div className="barra">
              <h2 style={{ margin: 0 }}>Curso {c.nombre}</h2>
              {c.activo ? <Chip color="verde">Activo</Chip> : <Chip>Archivado</Chip>}
              <span className="sep" />
              {!c.activo && (
                <form action={activarCurso}>
                  <input type="hidden" name="id" value={c.id} />
                  <button className="btn mini">Marcar como activo</button>
                </form>
              )}
            </div>
            {delCurso.length === 0 ? (
              <p className="muted small">Sin grupos.</p>
            ) : (
              <div className="tabla-wrap">
                <table className="datos">
                  <thead><tr><th>Grupo</th><th>Tutor/a</th><th /></tr></thead>
                  <tbody>
                    {delCurso.map((g) => (
                      <tr key={g.id}>
                        <td style={{ fontWeight: 600 }}>{nombreGrupo(g)}</td>
                        <td>
                          <select form={`g-${g.id}`} name="tutor_id" defaultValue={g.tutor_id ?? ""}>
                            <option value="">— Sin asignar —</option>
                            {activos.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                          </select>
                        </td>
                        <td>
                          <form id={`g-${g.id}`} action={asignarTutor}>
                            <input type="hidden" name="grupo_id" value={g.id} />
                            <button className="btn mini">Guardar</button>
                          </form>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        );
      })}
    </>
  );
}
