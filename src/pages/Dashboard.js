import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';
import '../styles/Dashboard.css'; // Importa el CSS que creamos antes

// Componente para evitar el error de Hooks
const MateriaAlumnosView = ({ materiaId, getHeaders, setView }) => {
  const [alumnos, setAlumnos] = useState([]);
  const [alumnosLoading, setAlumnosLoading] = useState(true);
  const [alumnosError, setAlumnosError] = useState('');

  useEffect(() => {
    const fetchAlumnosDeMateria = async () => {
      setAlumnosLoading(true);
      setAlumnosError('');
      // Endpoint: GET /api/materias/:id/alumnos
      const url = `${API_BASE_URL}/materias/${materiaId}/alumnos`;
      try {
        const response = await fetch(url, { headers: getHeaders() });
        if (response.ok) {
          setAlumnos(await response.json());
        } else {
          const errorData = await response.json();
          setAlumnosError(errorData.msg || 'Error al cargar alumnos de la materia.');
        }
      } catch (err) {
        setAlumnosError('Error de conexión con la API.');
      } finally {
        setAlumnosLoading(false);
      }
    };
    fetchAlumnosDeMateria();
  }, [materiaId, getHeaders]);

  return (
    <>
      <h3 className="section-heading">Alumnos Inscritos en Materia ID: {materiaId}</h3>
      <button onClick={() => setView('subjects')} className="btn btn-default" style={{ marginBottom: '20px' }}>
        ← Volver a Materias
      </button>

      {alumnosLoading && <p>Cargando alumnos...</p>}
      {alumnosError && <p className="message-error">Error: {alumnosError}</p>}

      {!alumnosLoading && alumnos.length === 0 && !alumnosError && <p>No hay alumnos inscritos en esta materia.</p>}

      {!alumnosLoading && alumnos.length > 0 && (
        <div className="list-container">
          <table className="data-table">
            <thead>
              <tr className="table-header-row">
                <th className="table-header-cell">ID</th>
                <th className="table-header-cell">Nombre</th>
                <th className="table-header-cell">Usuario</th>
                <th className="table-header-cell">Mail</th>
              </tr>
            </thead>
            <tbody>
              {alumnos.map((a) => (
                <tr key={a.id} className="table-row">
                  <td className="table-cell">{a.id}</td>
                  <td className="table-cell">{a.nombre}</td>
                  <td className="table-cell">{a.usuario}</td>
                  <td className="table-cell">{a.mail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
};


const Dashboard = () => {
  const { user, authToken, logout, isAuthenticated, isStudent } = useAuth();
  const [view, setView] = useState('profile');
  const [data, setData] = useState([]);
  const [subjectsList, setSubjectsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const userRole = user?.rol;
  const isAdmin = userRole === 1;
  const isCoord = userRole === 2;
  const isManagement = isAdmin || isCoord;

  const getHeaders = useCallback(() => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authToken}`
  }), [authToken]);

  // --- Funciones de Fetching (Carga de Datos) ---

  const fetchMaterias = useCallback(async (all = false) => {
    setLoading(true);
    const todosParam = all ? '?todos=true' : '';
    const url = `${API_BASE_URL}/materias${todosParam}`;
    try {
      const response = await fetch(url, { headers: getHeaders() });
      if (response.ok) {
        const result = await response.json();
        setSubjectsList(result);
        if (view === 'subjects') setData(result);
      } else {
        const errorData = await response.json();
        setError(errorData.msg || 'Error al cargar materias disponibles.');
      }
    } catch (err) {
      setError('Error de conexión con la API.');
    } finally {
      setLoading(false);
    }
  }, [getHeaders, view]);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    const todosParam = isManagement ? '?todos=true' : '';
    const url = `${API_BASE_URL}/alumnos${todosParam}`;
    try {
      const response = await fetch(url, { headers: getHeaders() });
      if (response.ok) {
        setData(await response.json());
      } else {
        const errorData = await response.json();
        setError(errorData.msg || 'Error al cargar la lista de alumnos.');
      }
    } catch (err) {
      setError('Error de conexión con la API.');
    } finally {
      setLoading(false);
    }
  }, [getHeaders, isManagement]);

  const fetchMyEnrollments = useCallback(async () => {
    setLoading(true);
    const url = `${API_BASE_URL}/alumnos/${user.id}/materias`;
    try {
      const response = await fetch(url, { headers: getHeaders() });
      if (response.ok) {
        setData(await response.json());
      } else {
        const errorData = await response.json();
        setError(errorData.msg || 'Error al cargar tus inscripciones.');
      }
    } catch (err) {
      setError('Error de conexión con la API.');
    } finally {
      setLoading(false);
    }
  }, [getHeaders, user?.id]);

  useEffect(() => {
    setError('');
    setMessage('');
    if (isAuthenticated && user) {
      if (isStudent || isAdmin) {
        fetchMaterias(isAdmin);
      }

      if (view === 'profile' && isStudent) {
        fetchMyEnrollments();
      } else if (view === 'subjects' && isManagement) {
        fetchMaterias(isAdmin);
      } else if ((view === 'students' || view === 'enrollment') && isManagement) {
        fetchStudents();
      }
    }
  }, [view, isAuthenticated, user, isStudent, fetchMyEnrollments, fetchMaterias, fetchStudents, isAdmin, isManagement]);

  // --- Lógica de Acciones (CUD) ---

  const handleEnrollment = async (materiaId, alumnoId = user.id) => {
    const isSelfEnrollment = alumnoId === user.id;

    if (!isSelfEnrollment && !isAdmin) {
      setError('Solo un administrador puede inscribir a otros alumnos.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/inscripciones`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          materia_id: materiaId,
          ...(isAdmin && !isSelfEnrollment && { alumno_id: alumnoId })
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setMessage(data.msg);
        if (isSelfEnrollment) fetchMyEnrollments();
      } else {
        setError(data.msg || 'Error al inscribir.');
      }
    } catch (err) {
      setError('Error de red al inscribir.');
    } finally {
      setLoading(false);
    }
  };

  const handleUnenrollment = async (materiaId, alumnoId = user.id) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/inscripciones`, {
        method: 'DELETE',
        headers: getHeaders(),
        body: JSON.stringify({ alumno_id: alumnoId, materia_id: materiaId }),
      });
      const data = await response.json();
      if (response.ok) {
        setMessage(data.msg);
        if (alumnoId === user.id) fetchMyEnrollments();
      } else {
        setError(data.msg || 'Error al dar de baja la inscripción.');
      }
    } catch (err) {
      setError('Error de red al dar de baja la inscripción.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStudent = async (alumnoId) => {
    if (!window.confirm('¿Estás seguro de que quieres dar de baja (desactivar) a este alumno?')) return;
    if (!isAdmin) {
      setError('Solo un administrador puede dar de baja a un alumno.');
      return;
    }

    setLoading(true);
    try {
      // DELETE /api/alumnos/:id para baja lógica
      const response = await fetch(`${API_BASE_URL}/alumnos/${alumnoId}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      const data = await response.json();
      if (response.ok) {
        setMessage(data.msg);
        fetchStudents();
      } else {
        setError(data.msg || 'Error al eliminar alumno.');
      }
    } catch (err) {
      setError('Error de red al eliminar alumno.');
    } finally {
      setLoading(false);
    }
  };

  // ✨ NUEVA FUNCIÓN: Reactiva al alumno (remueve fecha_baja)
  const handleReactivateStudent = async (alumnoId) => {
    if (!window.confirm('¿Estás seguro de que quieres reactivar a este alumno?')) return;
    if (!isAdmin) {
      setError('Solo un administrador puede reactivar a un alumno.');
      return;
    }

    setLoading(true);
    try {
      // Asumiendo la nueva ruta PUT /api/alumnos/:id/reactivar
      const response = await fetch(`${API_BASE_URL}/alumnos/${alumnoId}/reactivar`, {
        method: 'PUT', // Usamos PUT para esta acción
        headers: getHeaders(),
      });
      const data = await response.json();
      if (response.ok) {
        setMessage(data.msg || 'Alumno reactivado correctamente.');
        fetchStudents(); // Recargar lista de alumnos
      } else {
        setError(data.msg || 'Error al reactivar alumno. (Verifica si la ruta /reactivar está configurada en el backend)');
      }
    } catch (err) {
      setError('Error de red al reactivar alumno.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (path, body, successMsg, reloadFunc) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/${path}`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (response.ok) {
        setMessage(successMsg);
        reloadFunc();
      } else {
        setError(data.msg || 'Error al crear el recurso.');
      }
    } catch (err) {
      setError('Error de red al crear el recurso.');
    } finally {
      setLoading(false);
    }
  };


  // --- Componentes de Formulario (Sin cambios) ---

  const CreateStudentForm = ({ onCreated }) => {
    const [form, setForm] = useState({ nombre: '', mail: '', usuario: '', contrasena: '' });
    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
    const handleSubmit = (e) => {
      e.preventDefault();
      handleCreate('alumnos', form, 'Alumno creado correctamente.', onCreated);
    };

    return (
      <form onSubmit={handleSubmit} className="form-container">
        <h3>Crear Nuevo Alumno (Admin)</h3>
        <input type="text" name="nombre" placeholder="Nombre" onChange={handleChange} required className="form-input" />
        <input type="text" name="mail" placeholder="Mail" onChange={handleChange} required className="form-input" />
        <input type="text" name="usuario" placeholder="Usuario" onChange={handleChange} required className="form-input" />
        <input type="password" name="contrasena" placeholder="Contraseña" onChange={handleChange} required className="form-input" />
        <button type="submit" className="btn btn-green">Crear Alumno</button>
      </form>
    );
  };

  const CreateSubjectForm = ({ onCreated }) => {
    const [form, setForm] = useState({ nombre: '', carrera_id: '' });
    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
    const handleSubmit = (e) => {
      e.preventDefault();
      handleCreate('materias', form, 'Materia creada correctamente.', onCreated);
    };

    return (
      <form onSubmit={handleSubmit} className="form-container">
        <h3>Crear Nueva Materia (Admin)</h3>
        <input type="text" name="nombre" placeholder="Nombre de la Materia" onChange={handleChange} required className="form-input" />
        <input type="number" name="carrera_id" placeholder="ID de Carrera (1=Sistemas, 2=Lic. Info, 3=Tec. Prog.)" onChange={handleChange} required className="form-input" min="1" max="3" />
        <button type="submit" className="btn btn-green">Crear Materia</button>
      </form>
    );
  };

  const EnrollmentForm = ({ onEnrolled }) => {
    const [form, setForm] = useState({ alumno_id: '', materia_id: '' });
    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleInscribe = (e) => {
      e.preventDefault();
      handleEnrollment(Number(form.materia_id), Number(form.alumno_id)).then(onEnrolled);
    };

    const handleUninscribe = () => {
      handleUnenrollment(Number(form.materia_id), Number(form.alumno_id)).then(onEnrolled);
    };

    return (
      <form onSubmit={handleInscribe} className="form-container enrollment-form-container">
        <h3>Inscribir/Desinscribir Alumno (Admin)</h3>
        <input type="number" name="alumno_id" placeholder="ID del Alumno" onChange={handleChange} required className="form-input" min="1" />
        <input type="number" name="materia_id" placeholder="ID de la Materia" onChange={handleChange} required className="form-input" min="1" />
        <button type="submit" className="btn btn-blue">Inscribir</button>
        <button type="button" onClick={handleUninscribe} className="btn btn-red" style={{ marginLeft: '10px' }}>
          Desinscribir
        </button>
      </form>
    );
  };


  // --- Render Vistas (Rol 3, Sin cambios) ---

  const renderStudentView = () => (
    <>
      <h3 className="section-heading">Mis Materias Inscritas</h3>
      <div className="list-container">
        {data.length === 0 ? (
          <p>No estás inscrito en ninguna materia.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr className="table-header-row">
                <th className="table-header-cell">ID</th>
                <th className="table-header-cell">Materia</th>
                <th className="table-header-cell">Carrera</th>
                <th className="table-header-cell">Acción</th>
              </tr>
            </thead>
            <tbody>
              {data.map((m) => (
                <tr key={m.id} className="table-row">
                  <td className="table-cell">{m.id}</td>
                  <td className="table-cell">{m.materia}</td>
                  <td className="table-cell">{m.carrera}</td>
                  <td className="table-cell">
                    <button onClick={() => handleUnenrollment(m.id)} className="btn btn-red" style={{ padding: '5px 10px' }}>
                      Dar de Baja
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <h3 className="section-heading">Inscripción</h3>
      <div className="list-container">
        {subjectsList.length === 0 ? (
          <p>Cargando materias disponibles...</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {subjectsList
              .filter(m => m.fecha_baja === null)
              .map(m => (
                <li key={m.id} style={{ marginBottom: '10px', padding: '10px', border: '1px solid #eee' }}>
                  **{m.materia}** ({m.carrera}) - ID: {m.id}
                  <button
                    onClick={() => handleEnrollment(m.id)}
                    className="btn btn-blue"
                    style={{ marginLeft: '15px', padding: '5px 10px' }}
                    disabled={data.some(insc => insc.id === m.id)}
                  >
                    {data.some(insc => insc.id === m.id) ? 'Ya Inscrito' : 'Inscribirse'}
                  </button>
                </li>
              ))}
          </ul>
        )}
      </div>
    </>
  );

  // --- Render Vistas (Roles 1 y 2) ---

  const renderStudentsView = () => (
    <>
      <h3 className="section-heading">Gestión de Alumnos</h3>
      {isAdmin && <CreateStudentForm onCreated={fetchStudents} />}

      <div className="list-container">
        {data.length === 0 ? (
          <p>No hay alumnos registrados.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr className="table-header-row">
                <th className="table-header-cell">ID</th>
                <th className="table-header-cell">Nombre</th>
                <th className="table-header-cell">Usuario</th>
                <th className="table-header-cell">Mail</th>
                <th className="table-header-cell">Activo</th>
                {isAdmin && <th className="table-header-cell">Acciones (Admin)</th>}
              </tr>
            </thead>
            <tbody>
              {data.map((a) => (
                <tr key={a.id} className="table-row">
                  <td className="table-cell">{a.id}</td>
                  <td className="table-cell">{a.nombre}</td>
                  <td className="table-cell">{a.usuario}</td>
                  <td className="table-cell">{a.mail}</td>
                  <td className="table-cell">{a.fecha_baja === null ? '✅' : '❌'}</td>
                  {isAdmin && (
                    <td className="table-cell">
                      {/* Botón Dar de Baja (solo si está activo) */}
                      <button
                        onClick={() => handleDeleteStudent(a.id)}
                        disabled={a.fecha_baja !== null}
                        className="btn btn-red"
                        style={{ padding: '5px 10px', marginRight: '5px' }}
                      >
                        Dar de Baja
                      </button>

                      {/* Botón Reactivar (solo si está inactivo) */}
                      {a.fecha_baja !== null && (
                        <button
                          onClick={() => handleReactivateStudent(a.id)}
                          className="btn btn-blue"
                          style={{ padding: '5px 10px' }}
                        >
                          Reactivar
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );

  const renderSubjectsView = () => (
    <>
      <h3 className="section-heading">Lista de Materias</h3>
      {isAdmin && <CreateSubjectForm onCreated={() => fetchMaterias(isAdmin)} />}

      <div className="list-container">
        {data.length === 0 ? (
          <p>No hay materias registradas.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr className="table-header-row">
                <th className="table-header-cell">ID</th>
                <th className="table-header-cell">Materia</th>
                <th className="table-header-cell">Carrera</th>
                <th className="table-header-cell">Activa</th>
                {(isAdmin || isCoord) && <th className="table-header-cell">Ver Alumnos</th>}
              </tr>
            </thead>
            <tbody>
              {data.map((m) => (
                <tr key={m.id} className="table-row">
                  <td className="table-cell">{m.id}</td>
                  <td className="table-cell">{m.materia}</td>
                  <td className="table-cell">{m.carrera}</td>
                  <td className="table-cell">{m.fecha_baja === null ? '✅' : '❌'}</td>
                  {(isAdmin || isCoord) && (
                    <td className="table-cell">
                      <button onClick={() => setView(`materia_alumnos_${m.id}`)} className="btn btn-blue" style={{ padding: '5px 10px' }}>
                        Ver Alumnos
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );

  const renderEnrollmentManagement = () => (
    <>
      <h3 className="section-heading">Gestión de Inscripciones (Admin)</h3>
      <EnrollmentForm
        onEnrolled={() => {
          setMessage('Operación de inscripción/desinscripción completada.');
        }}
      />

      <div style={{ display: 'flex', gap: '20px' }}>
        <div style={{ flex: 1 }}>
          <h4 className="sub-heading">Alumnos Activos (ID)</h4>
          <ul className="scrollable-list">
            {data
              .filter(a => a.fecha_baja === null)
              .map(a => <li key={a.id}>{a.id}: {a.nombre}</li>)}
          </ul>
        </div>
        <div style={{ flex: 1 }}>
          <h4 className="sub-heading">Alumnos Inactivos (ID)</h4>
          <ul className="scrollable-list">
            {data
              .filter(a => a.fecha_baja !== null)
              .map(a => <li key={a.id}>{a.id}: {a.nombre}</li>)}
          </ul>
        </div>
        <div style={{ flex: 1 }}>
          <h4 className="sub-heading">Materias Activas (ID)</h4>
          <ul className="scrollable-list">
            {subjectsList.filter(m => m.fecha_baja === null).map(m => <li key={m.id}>{m.id}: {m.materia}</li>)}
          </ul>
        </div>
      </div>
    </>
  );

  // --- Lógica de Renderizado Principal ---

  const renderView = () => {
    if (loading) return <p className="message-loading">Cargando datos...</p>;

    if (view.startsWith('materia_alumnos_')) {
      const materiaId = view.split('_')[2];
      return <MateriaAlumnosView
        materiaId={materiaId}
        getHeaders={getHeaders}
        setView={setView}
      />;
    }

    switch (view) {
      case 'profile':
        if (isStudent) return renderStudentView();
        if (isManagement) return <p>Bienvenido. Usa la navegación de arriba para empezar a gestionar.</p>;
        break;
      case 'students':
        if (isManagement) return renderStudentsView();
        break;
      case 'subjects':
        if (isManagement) return renderSubjectsView();
        break;
      case 'enrollment':
        if (isAdmin) return renderEnrollmentManagement();
        break;
      default:
        if (isStudent) {
          setView('profile');
        } else if (isManagement) {
          setView('students');
        }
        return <p>Dashboard no disponible para tu rol (Rol ID: {userRole}).</p>;
    }
  };

  if (!isAuthenticated || !user) return <p>Redirigiendo al login...</p>;


  const rolNombre = userRole === 1 ? 'Administrador' : userRole === 2 ? 'Coordinador' : 'Alumno';

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1 style={{ margin: 0 }}>Panel de Gestión de Alumnos</h1>
        <div className="user-info">
          <span>👤 Rol: **{rolNombre}** | ID: {user.id}</span>
          <button onClick={logout} className="btn btn-red" style={{ marginLeft: '20px' }}>
            Cerrar Sesión
          </button>
        </div>
      </header>

      {/* Pestañas de Navegación */}
      <nav className="dashboard-nav">
        <button onClick={() => setView('profile')} className={`nav-button ${view === 'profile' ? 'active' : ''}`}>
          {isStudent ? 'Mis Inscripciones' : 'Mi Perfil'}
        </button>
        {isManagement && (
          <>
            <button onClick={() => setView('students')} className={`nav-button ${view === 'students' ? 'active' : ''}`}>
              Alumnos
            </button>
            <button onClick={() => setView('subjects')} className={`nav-button ${view === 'subjects' || view.startsWith('materia_alumnos_') ? 'active' : ''}`}>
              Materias
            </button>
          </>
        )}
        {isAdmin && (
          <button onClick={() => setView('enrollment')} className={`nav-button ${view === 'enrollment' ? 'active' : ''}`}>
            Inscripciones (Admin)
          </button>
        )}
      </nav>

      <main className="main-content">
        {loading && <p className="message-loading">Cargando datos o procesando acción...</p>}
        {message && <p className="message-success">✅ {message}</p>}
        {error && <p className="message-error">❌ {error}</p>}

        {renderView()}
      </main>
    </div>
  );
};

export default Dashboard;