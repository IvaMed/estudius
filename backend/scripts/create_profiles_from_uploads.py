#!/usr/bin/env python3
import os
import sqlite3
import json
import random
import time
import re
import shutil
import sys


def random_int(a, b):
    return random.randint(a, b)


def random_element(seq):
    return random.choice(seq)


def generate_phone():
    # Formato argentino aproximado: +54 9 (area) xxxx xxxx
    area = random_element(['11', '221', '351', '341', '297'])
    part1 = str(random_int(1000, 9999))
    part2 = str(random_int(1000, 9999))
    return f"+54 9 {area} {part1} {part2}"


def parse_all_subjects(model_path):
    try:
        text = open(model_path, 'r', encoding='utf-8').read()
        m = re.search(r"const\s+ALL_SUBJECTS\s*=\s*\[([\s\S]*?)\];", text)
        if not m:
            return None
        inner = m.group(1)
        # Find all quoted strings
        items = re.findall(r"'(.*?)'|\"(.*?)\"", inner)
        subjects = [a if a else b for (a, b) in items]
        return subjects
    except Exception:
        return None


def ensure_modalities_column(conn):
    cur = conn.cursor()
    cur.execute("PRAGMA table_info(teachers)")
    cols = [row[1] for row in cur.fetchall()]
    if 'modalities' not in cols:
        print('Añadiendo columna `modalities` a la tabla teachers...')
        cur.execute('ALTER TABLE teachers ADD COLUMN modalities TEXT')
        conn.commit()
        print('Columna `modalities` creada')
    else:
        print('Columna `modalities` ya existe')


def main():
    base = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
    db_path = os.path.join(base, 'Database', 'estudius.db')
    schema_path = os.path.join(base, 'Database', 'schema.sql')
    model_path = os.path.join(base, 'Backend', 'models', 'teacherModel.js')
    uploads_root = os.path.join(base, 'Frontend', 'Assets', 'uploads')

    if not os.path.exists(db_path):
        print('Base de datos no encontrada en', db_path)
        # Create empty DB file; schema will be applied

    # Load subjects list from model to keep consistency with frontend
    subjects = parse_all_subjects(model_path) or [
        'Matemática', 'Lengua', 'Historia', 'Programación', 'Inglés', 'Física', 'Química'
    ]

    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    # Ensure schema is applied (executes CREATE TABLE IF NOT EXISTS)
    try:
        if os.path.exists(schema_path):
            schema = open(schema_path, 'r', encoding='utf-8').read()
            cur.executescript(schema)
            conn.commit()
    except Exception as e:
        print('Aviso: no pude aplicar schema.sql:', e)

    ensure_modalities_column(conn)

    genders = ['hombres', 'mujeres']

    first_names = ['Alex','Mateo','Lucas','Santiago','Martín','Diego','Lucía','María','Valentina','Sofía','Camila','Ana','Paula','Julia']
    last_names = ['García','Pérez','Rodríguez','Gómez','López','Martínez','Santos','Silva','Rojas','Fernández']
    curriculums = [
        'Programa estructurado de teoría y práctica',
        'Clases personalizadas con ejercicios y seguimiento',
        'Temario orientado a resolución de problemas y exámenes',
        'Enfoque práctico con proyectos y evaluación continua'
    ]
    schedules = [
        'Lun/Mié/Vie 18:00-20:00',
        'Mar/Jue 10:00-12:00',
        'Sábados 09:00-12:00',
        'Horario flexible'
    ]
    locations = ['CABA - Centro','CABA - Norte','Gran Buenos Aires','La Plata']

    total_created = 0
    for gender in genders:
        dir_path = os.path.join(uploads_root, gender)
        if not os.path.isdir(dir_path):
            print('No existe carpeta:', dir_path)
            continue

        files = [f for f in os.listdir(dir_path) if os.path.splitext(f)[1].lower() in ('.jpg', '.jpeg', '.png')]
        for fname in files:
            original = os.path.join(dir_path, fname)
            try:
                first = random_element(first_names)
                last = random_element(last_names)
                age = random_int(25, 60)
                email = f"teacher_{int(time.time()*1000)}_{random_int(1000,9999)}@example.com"
                phone = generate_phone()
                subj_count = random_int(2, min(4, max(2, len(subjects))))
                subj = random.sample(subjects, subj_count)

                if random.random() < 0.2:
                    modalities = ['virtual', 'presencial']
                else:
                    modalities = [random_element(['virtual', 'presencial'])]
                modality = modalities[0]

                curriculum = random_element(curriculums)
                schedule = random_element(schedules)
                location = random_element(locations) if 'presencial' in modalities else None
                description = f"Profesor/a con experiencia en {', '.join(subj)}."

                photo_rel = f"/assets/uploads/{gender}/{fname}"
                class_size = random_int(1, 5)
                views = random_int(0, 50)

                sql = (
                    "INSERT INTO teachers (firstName, lastName, age, email, phone, description, curriculum, "
                    "photo, classSize, subjects, modality, modalities, schedules, location, views) "
                    "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
                )
                params = [
                    first, last, age, email, phone, description, curriculum,
                    photo_rel, class_size, json.dumps(subj), modality, json.dumps(modalities), schedule, location, views
                ]

                cur.execute(sql, params)
                tid = cur.lastrowid
                conn.commit()

                # Rename file to <id>.<ext>
                ext = os.path.splitext(fname)[1].lower()
                new_fname = f"{tid}{ext}"
                new_path = os.path.join(dir_path, new_fname)
                shutil.move(original, new_path)

                new_photo_rel = f"/assets/uploads/{gender}/{new_fname}"
                cur.execute('UPDATE teachers SET photo = ? WHERE id = ?', (new_photo_rel, tid))
                conn.commit()

                print(f"Creado profesor ID={tid} -> {new_photo_rel}")
                total_created += 1
            except Exception as e:
                print('Error con archivo', fname, e)

    conn.close()
    print('\nTotal perfiles creados/actualizados:', total_created)


if __name__ == '__main__':
    main()
