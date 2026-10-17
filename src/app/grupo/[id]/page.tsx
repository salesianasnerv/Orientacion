import Link from "next/link";
import { notFound } from "next/navigation";
import { incorporarAlSeguimiento } from "@/app/acciones";
import { Chip, Marco } from "@/components/Marco";
import { nombreCompleto, nombreGrupo, TIPOS_NEAE, type Alumno, type Ficha, type Grupo } from "@/lib/datos";
import { createClient, obtenerPerfil } from "@/lib/supabase/server";

type FilaPadron = { banos_alumno_id: number; nombre_seneca: string; orden: number; alumno_id: string | null };

export default async function PaginaGrupo({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const perfil = await obtenerPerfil();
  if (!perfil?.es_personal) return <Marco perfil={perfil}>{null}</Marco>;

  const supabase = await createClient();
  const { data: grupo } = await supabase
    .from("grupo")
    .select("id, letra, curso_academico_id, nivel:nivel_id(nombre, orden), tutor:tutor_id(nombre, email), curso:curso_academico_id(nombre, activo)")
    .eq("id", id)
    .returns<(Grupo & { curso: { nombre: string; activo: boolean } })[]>()
    .maybeSingle();
  if (!grupo) notFound();

  const [{ data: matriculas }, { data: padron }] = await Promise.all([
    supabase.from("matricula").select("alumno_id").eq("grupo_id", id),
    supabase.from("padron").select("banos_alumno_id, nombre_seneca, orden, alumno_id").eq("grupo_id", id).order("orden").returns<FilaPadron[]>(),
  ]);
  const ids = matriculas?.map((m) => m.alumno_id) ?? [];
  const [{ data: alumnos }, { data: fichas }] = await Promise.all([
    supabase.from("alumno").select("id, nombre, apellidos, nombre_seneca").in("id", ids).returns<Alumno[]>(),
    supabase.from("ficha_curso").select("*").in("alumno_id", ids).eq("curso_academico_id", grupo.curso_academico_id).returns<Ficha[]>(),
  ]);
  const fichaDe = new Map(fichas?.map((f) => [f.alumno_id, f]));
  const seguimiento = [...(alumnos ?? [])].sort((a, b) => nombreCompleto(a).localeCompare(nombreCompleto(b), "es"));

  const esTutor = grupo.tutor?.email?.toLowerCase() === perfil.email?.toLowerCase();
  const puedeEditar = perfil.rol === "orientacion" || (esTutor && grupo.curso.activo);
  const censados = fichas?.filter((f) => f.censado).length ?? 0;

  return (
    <Marco
      perfil={perfil}
      curso={grupo.curso.nombre}
      pestana="grupos"
      migas={<><Link href={`/?curso=${grupo.curso_academico_id}`}>Grupos {grupo.curso.nombre}</Link> › <b>{nombreGrupo(grupo)}</b></>}
    >
      <div className="cab-ficha">
        <div>
          <h1>{nombreGrupo(grupo)}</h1>
          <p className="muted" style={{ margin: 0 }}>Tutor/a: {grupo.tutor?.nombre ?? "sin asignar"}</p>
        </div>
        <div className="chips">
          <Chip color="azul">{seguimiento.length} en seguimiento</Chip>
          <Chip color="verde">{censados} censados</Chip>
          <Chip color="naranja">{seguimiento.length - censados} sin censar</Chip>
          {!puedeEditar && <Chip>Solo consulta</Chip>}
        </div>
      </div>

      <section className="panel">
        <h2>Alumnado en seguimiento</h2>
        {seguimiento.length === 0 ? (
          <p className="vacio">Nadie en seguimiento en este grupo.</p>
        ) : (
          <div className="tabla-wrap">
            <table className="datos">
              <thead>
                <tr><th>Alumno/a</th><th>Séneca</th><th>NEAE</th><th>Diagnóstico</th></tr>
              </thead>
              <tbody>
                {seguimiento.map((a) => {
                  const f = fichaDe.get(a.id);
                  return (
                    <tr key={a.id}>
                      <td><Link href={`/alumno/${a.id}?curso=${grupo.curso_academico_id}`} style={{ fontWeight: 600 }}>{nombreCompleto(a)}</Link></td>
                      <td>{!f ? <Chip>Sin ficha</Chip> : f.censado ? <Chip color="azul">Censado</Chip> : <Chip color="naranja">Sin censar</Chip>}</td>
                      <td title={f?.tipo_neae ? TIPOS_NEAE[f.tipo_neae] : undefined}>
                        <div className="chips">
                          {f?.tipo_neae ? <Chip color="verde">{f.tipo_neae}</Chip> : <span className="muted">—</span>}
                          {f?.dictamen && <Chip color="morado">Dictamen</Chip>}
                        </div>
                      </td>
                      <td className="muted small">{f?.diagnostico?.split("\n").slice(0, 2).join(" · ") ?? ""}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="panel">
        <h2 className="verde">Lista de clase <span className="muted small" style={{ fontWeight: 400 }}>· {padron?.length ?? 0} alumnos, de Control de baños</span></h2>
        {!padron?.length ? (
          <p className="vacio">Este grupo no está enlazado con una clase de Control de baños.</p>
        ) : (
          <ul className="lista">
            {padron.map((p) => (
              <li key={p.banos_alumno_id}>
                {p.alumno_id ? (
                  <Link href={`/alumno/${p.alumno_id}?curso=${grupo.curso_academico_id}`} style={{ fontWeight: 600 }}>{p.nombre_seneca}</Link>
                ) : (
                  <span>{p.nombre_seneca}</span>
                )}
                {p.alumno_id ? (
                  <Chip color="azul">En seguimiento</Chip>
                ) : (
                  puedeEditar && (
                    <form action={incorporarAlSeguimiento}>
                      <input type="hidden" name="grupo_id" value={grupo.id} />
                      <input type="hidden" name="curso_academico_id" value={grupo.curso_academico_id} />
                      <input type="hidden" name="nombre_seneca" value={p.nombre_seneca} />
                      <button className="btn mini">+ Añadir al seguimiento</button>
                    </form>
                  )
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </Marco>
  );
}
