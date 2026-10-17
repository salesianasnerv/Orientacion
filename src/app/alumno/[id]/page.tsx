import Link from "next/link";
import { notFound } from "next/navigation";
import { crearFichaCurso } from "@/app/acciones";
import { Chip, Marco } from "@/components/Marco";
import { nombreCompleto, nombreGrupo, TIPOS_NEAE } from "@/lib/datos";
import { obtenerPerfil } from "@/lib/supabase/server";
import { cargarAlumno } from "./cargar";

function Bloque({ titulo, texto, color }: { titulo: string; texto: string | null | undefined; color?: string }) {
  return (
    <section className="panel">
      <h2 className={color}>{titulo}</h2>
      {texto ? <p className="texto-largo">{texto}</p> : <p className="muted">—</p>}
    </section>
  );
}

export default async function PaginaAlumno({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ curso?: string }> }) {
  const [{ id }, { curso: cursoParam }] = await Promise.all([params, searchParams]);
  const perfil = await obtenerPerfil();
  if (!perfil?.es_personal) return <Marco perfil={perfil}>{null}</Marco>;

  const d = await cargarAlumno(id, cursoParam);
  if (!d) notFound();
  const { alumno, curso, cursosAlumno, ficha, matricula, historial } = d;
  const grupo = matricula?.grupo;

  return (
    <Marco
      perfil={perfil}
      curso={curso?.nombre}
      pestana="grupos"
      migas={<>
        <Link href={`/?curso=${curso?.id ?? ""}`}>Grupos</Link>
        {grupo && <> › <Link href={`/grupo/${grupo.id}`}>{nombreGrupo(grupo)}</Link></>} › <b>{nombreCompleto(alumno)}</b>
      </>}
    >
      <div className="cab-ficha">
        <div>
          <h1>{nombreCompleto(alumno)}</h1>
          <p className="muted" style={{ margin: 0 }}>
            {grupo ? `${nombreGrupo(grupo)} · Tutor/a: ${grupo.tutor?.nombre ?? "sin asignar"}` : "Sin grupo en este curso"}
            {matricula?.repetidor && " · Repetidor/a"}
          </p>
        </div>
        <div className="barra" style={{ margin: 0 }}>
          {cursosAlumno.length > 1 && cursosAlumno.map((c) => (
            <Link key={c.id} href={`/alumno/${id}?curso=${c.id}`} className={`btn mini ${c.id === curso?.id ? "pri" : ""}`}>{c.nombre}</Link>
          ))}
          {d.puedeEditar && ficha && <Link href={`/alumno/${id}/editar?curso=${curso?.id}`} className="btn pri">Editar ficha</Link>}
          {!d.puedeEditar && <Chip>Solo consulta</Chip>}
        </div>
      </div>

      {!ficha ? (
        <div className="aviso info">
          <p style={{ margin: "0 0 8px" }}>No hay ficha de Orientación para {curso?.nombre ?? "este curso"}.</p>
          {d.puedeCrearFicha && curso && (
            <form action={crearFichaCurso}>
              <input type="hidden" name="alumno_id" value={id} />
              <input type="hidden" name="curso_academico_id" value={curso.id} />
              <button className="btn pri">Crear ficha de {curso.nombre} a partir de la anterior</button>
            </form>
          )}
        </div>
      ) : (
        <>
          <section className="panel">
            <div className="chips" style={{ alignItems: "center" }}>
              {ficha.censado ? <Chip color="azul">Censado en Séneca</Chip> : <Chip color="naranja">Sin censar</Chip>}
              {ficha.tipo_neae && <Chip color="verde">{TIPOS_NEAE[ficha.tipo_neae] ?? ficha.tipo_neae}</Chip>}
              {ficha.dictamen && <Chip color="morado">Dictamen de escolarización</Chip>}
              {matricula?.materias_pendientes && <Chip color="rojo">Pendientes: {matricula.materias_pendientes}</Chip>}
            </div>
          </section>
          <Bloque titulo="Diagnóstico / NEAE" texto={ficha.diagnostico} color="verde" />
          <div className="cols" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <Bloque titulo="Atención recibida" texto={ficha.atencion_recibida} />
            <Bloque titulo={`Observaciones ${curso?.nombre ?? ""}`} texto={ficha.observaciones} />
          </div>
          <Bloque titulo="Propuesta de medidas" texto={ficha.propuesta_medidas} color="naranja" />
        </>
      )}

      <section className="panel">
        <h2>Histórico</h2>
        {historial.length === 0 ? (
          <p className="vacio">Sin entradas.</p>
        ) : (
          <ol className="historial">
            {historial.map((h) => (
              <li key={h.id}>
                <div className="etiqueta">{h.etiqueta}</div>
                <p className="texto-largo">{h.texto}</p>
              </li>
            ))}
          </ol>
        )}
      </section>
    </Marco>
  );
}
