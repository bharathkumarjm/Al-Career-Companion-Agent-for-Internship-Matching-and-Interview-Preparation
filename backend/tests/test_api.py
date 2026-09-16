from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


# ==============================
# BASIC API TESTS
# ==============================

def test_root():
    response = client.get("/")

    assert response.status_code == 200

    data = response.json()

    assert "message" in data


def test_openapi():
    response = client.get("/openapi.json")

    assert response.status_code == 200

    data = response.json()

    assert "paths" in data


def test_docs():
    response = client.get("/docs")

    assert response.status_code == 200


# ==============================
# AUTHENTICATION TESTS
# ==============================

def test_protected_endpoint_without_token():
    response = client.get("/auth/me")

    assert response.status_code in [401, 403]


def test_register_user():
    response = client.post(
        "/auth/register",
        json={
            "name": "Test Intern",
            "email": "testintern123@example.com",
            "password": "Test@12345"
        }
    )

    assert response.status_code in [200, 400, 409]


def test_login_user():
    response = client.post(
        "/auth/login",
        json={
            "email": "testintern123@example.com",
            "password": "Test@12345"
        }
    )

    assert response.status_code == 200

    data = response.json()

    assert "access_token" in data


# ==============================
# PROJECT TESTS
# ==============================

def test_projects_without_token():
    response = client.get("/projects/")

    assert response.status_code in [401, 403]


def test_invalid_project():
    response = client.get("/projects/999999")

    assert response.status_code in [401, 403, 404]


# ==============================
# TASK TESTS
# ==============================

def test_invalid_task():
    response = client.get("/tasks/999999")

    assert response.status_code in [401, 403, 404]


# ==============================
# RESUME TESTS
# ==============================

def test_invalid_resume():
    response = client.get("/resumes/999999/analysis")

    assert response.status_code in [401, 403, 404]


# ==============================
# DASHBOARD TEST
# ==============================

def test_dashboard_without_token():
    response = client.get("/dashboard")

    assert response.status_code in [401, 403, 404]

# ==============================
# AUTHENTICATED API TEST
# ==============================

def test_authenticated_profile():
    # Login
    login_response = client.post(
        "/auth/login",
        json={
            "email": "testintern123@example.com",
            "password": "Test@12345"
        }
    )

    assert login_response.status_code == 200

    data = login_response.json()

    assert "access_token" in data

    token = data["access_token"]

    # Use token
    response = client.get(
        "/auth/me",
        headers={
            "Authorization": f"Bearer {token}"
        }
    )

    assert response.status_code == 200

    profile = response.json()

    assert "id" in profile
    assert "name" in profile
    assert "email" in profile
    assert "role" in profile

def test_create_submission():
    # 1. Login
    login_response = client.post(
        "/auth/login",
        json={
            "email": "testintern123@example.com",
            "password": "Test@12345"
        }
    )

    assert login_response.status_code == 200

    token = login_response.json()["access_token"]

    headers = {
        "Authorization": f"Bearer {token}"
    }

    # 2. Get current user
    me_response = client.get(
        "/auth/me",
        headers=headers
    )

    assert me_response.status_code == 200

    intern_id = me_response.json()["id"]

    # 3. Create a project
    project_response = client.post(
        "/projects/",
        headers=headers,
        json={
            "title": "Submission Test Project",
            "description": "Project for testing submissions",
            "intern_id": intern_id
        }
    )

    assert project_response.status_code == 200

    project_id = project_response.json()["id"]

    # 4. Create a task
    task_response = client.post(
        "/tasks/",
        headers=headers,
        json={
            "title": "Submission Test Task",
            "description": "Task for testing submission API",
            "project_id": project_id,
            "intern_id": intern_id
        }
    )

    assert task_response.status_code == 200

    task_id = task_response.json()["id"]

    # 5. Create submission
    submission_response = client.post(
        "/submissions/",
        headers=headers,
        json={
            "task_id": task_id,
            "intern_id": intern_id,
            "submission_text": "This is my completed task submission.",
            "file_path": None
        }
    )

    assert submission_response.status_code == 200

    submission = submission_response.json()

    assert "id" in submission
    assert submission["task_id"] == task_id
    assert submission["intern_id"] == intern_id

def test_create_code_review():
    # Login
    login_response = client.post(
        "/auth/login",
        json={
            "email": "testintern123@example.com",
            "password": "Test@12345"
        }
    )

    assert login_response.status_code == 200

    token = login_response.json()["access_token"]

    headers = {
        "Authorization": f"Bearer {token}"
    }

    # Get current user
    me_response = client.get(
        "/auth/me",
        headers=headers
    )

    assert me_response.status_code == 200

    intern_id = me_response.json()["id"]

    # Create project
    project_response = client.post(
        "/projects/",
        headers=headers,
        json={
            "title": "Code Review Test Project",
            "description": "Project for code review testing",
            "intern_id": intern_id
        }
    )

    assert project_response.status_code == 200

    project_id = project_response.json()["id"]

    # Create task
    task_response = client.post(
        "/tasks/",
        headers=headers,
        json={
            "title": "Code Review Test Task",
            "description": "Task for code review testing",
            "project_id": project_id,
            "intern_id": intern_id
        }
    )

    assert task_response.status_code == 200

    task_id = task_response.json()["id"]

    # Create submission
    submission_response = client.post(
        "/submissions/",
        headers=headers,
        json={
            "task_id": task_id,
            "intern_id": intern_id,
            "submission_text": "def hello(): return 'Hello World'",
            "file_path": None
        }
    )

    assert submission_response.status_code == 200

    submission_id = submission_response.json()["id"]

    # Create code review
    review_response = client.post(
        "/code-reviews/",
        headers=headers,
        json={
            "submission_id": submission_id,
            "intern_id": intern_id,
            "code": "def hello(): return 'Hello World'"
        }
    )

    assert review_response.status_code == 200

    review = review_response.json()

    assert "id" in review
    assert review["submission_id"] == submission_id

def test_create_feedback():
    # Login
    login_response = client.post(
        "/auth/login",
        json={
            "email": "testintern123@example.com",
            "password": "Test@12345"
        }
    )

    assert login_response.status_code == 200

    token = login_response.json()["access_token"]

    headers = {
        "Authorization": f"Bearer {token}"
    }

    # Get current user
    me_response = client.get(
        "/auth/me",
        headers=headers
    )

    assert me_response.status_code == 200

    intern_id = me_response.json()["id"]

    # Create project
    project_response = client.post(
        "/projects/",
        headers=headers,
        json={
            "title": "Feedback Test Project",
            "description": "Project for feedback testing",
            "intern_id": intern_id
        }
    )

    assert project_response.status_code == 200

    project_id = project_response.json()["id"]

    # Create task
    task_response = client.post(
        "/tasks/",
        headers=headers,
        json={
            "title": "Feedback Test Task",
            "description": "Task for feedback testing",
            "project_id": project_id,
            "intern_id": intern_id
        }
    )

    assert task_response.status_code == 200

    task_id = task_response.json()["id"]

    # Create submission
    submission_response = client.post(
        "/submissions/",
        headers=headers,
        json={
            "task_id": task_id,
            "intern_id": intern_id,
            "submission_text": "Completed the assigned task.",
            "file_path": None
        }
    )

    assert submission_response.status_code == 200

    submission_id = submission_response.json()["id"]

    # Create mentor feedback
    feedback_response = client.post(
        "/feedback/",
        headers=headers,
        json={
            "submission_id": submission_id,
            "mentor_id": intern_id,
            "feedback": "Good work. Improve code structure and documentation.",
            "rating": 4
        }
    )

    assert feedback_response.status_code == 200

    feedback = feedback_response.json()

    assert "id" in feedback
    assert feedback["submission_id"] == submission_id
    assert feedback["mentor_id"] == intern_id
    assert feedback["rating"] == 4

def test_attendance_api():
    
    # ==========================================
    # 1. LOGIN
    # ==========================================

    login_response = client.post(
        "/auth/login",
        json={
            "email": "testintern123@example.com",
            "password": "Test@12345"
        }
    )

    assert login_response.status_code == 200

    token = login_response.json()["access_token"]

    headers = {
        "Authorization": f"Bearer {token}"
    }


    # ==========================================
    # 2. GET CURRENT USER
    # ==========================================

    me_response = client.get(
        "/auth/me",
        headers=headers
    )

    assert me_response.status_code == 200

    intern_id = me_response.json()["id"]


    # ==========================================
    # 3. MARK ATTENDANCE
    # ==========================================

    attendance_response = client.post(
        "/attendance/",
        headers=headers,
        json={
            "intern_id": intern_id,
            "date": "2026-08-31",
            "status": "present"
        }
    )

    assert attendance_response.status_code == 200

    attendance = attendance_response.json()

    assert "id" in attendance
    assert attendance["intern_id"] == intern_id
    assert attendance["status"] == "present"


    # ==========================================
    # 4. GET MY ATTENDANCE
    # ==========================================

    my_attendance_response = client.get(
        "/attendance/",
        headers=headers
    )

    assert my_attendance_response.status_code == 200

    attendance_list = my_attendance_response.json()

    assert isinstance(attendance_list, list)

    assert any(
        item["id"] == attendance["id"]
        for item in attendance_list
    )


    # ==========================================
    # 5. GET ATTENDANCE BY INTERN
    # ==========================================

    intern_attendance_response = client.get(
        f"/attendance/intern/{intern_id}",
        headers=headers
    )

    assert intern_attendance_response.status_code == 200

    intern_attendance = intern_attendance_response.json()

    assert isinstance(intern_attendance, list)

    assert any(
        item["id"] == attendance["id"]
        for item in intern_attendance
    )

def test_training_api():
    
    # ==========================================
    # 1. LOGIN
    # ==========================================

    login_response = client.post(
        "/auth/login",
        json={
            "email": "testintern123@example.com",
            "password": "Test@12345"
        }
    )

    assert login_response.status_code == 200

    token = login_response.json()["access_token"]

    headers = {
        "Authorization": f"Bearer {token}"
    }


    # ==========================================
    # 2. CREATE TRAINING SESSION
    # ==========================================

    training_response = client.post(
        "/training/",
        headers=headers,
        json={
            "title": "FastAPI Training",
            "description": "Introduction to FastAPI development",
            "date": "2026-09-01",
            "time": "10:00:00",
            "trainer": "Technical Mentor"
        }
    )

    assert training_response.status_code == 200

    training = training_response.json()

    assert "id" in training
    assert training["title"] == "FastAPI Training"
    assert training["status"] == "scheduled"

    training_id = training["id"]


    # ==========================================
    # 3. GET ALL TRAINING SESSIONS
    # ==========================================

    all_training_response = client.get(
        "/training/",
        headers=headers
    )

    assert all_training_response.status_code == 200

    training_list = all_training_response.json()

    assert isinstance(training_list, list)

    assert any(
        item["id"] == training_id
        for item in training_list
    )


    # ==========================================
    # 4. GET SINGLE TRAINING SESSION
    # ==========================================

    single_training_response = client.get(
        f"/training/{training_id}",
        headers=headers
    )

    assert single_training_response.status_code == 200

    single_training = single_training_response.json()

    assert single_training["id"] == training_id
    assert single_training["title"] == "FastAPI Training"
    assert single_training["status"] == "scheduled"

# ==========================================
# TEST LEARNING PROGRESS API
# ==========================================

def test_progress_api():

    # ==========================================
    # 1. LOGIN
    # ==========================================

    login_response = client.post(
        "/auth/login",
        json={
            "email": "testintern123@example.com",
            "password": "Test@12345"
        }
    )

    assert login_response.status_code == 200

    token = login_response.json()["access_token"]

    headers = {
        "Authorization": f"Bearer {token}"
    }

    # ==========================================
    # 2. CREATE LEARNING PROGRESS
    # ==========================================

    progress_response = client.post(
        "/progress/",
        headers=headers,
        json={
            "course_name": "FastAPI Development",
            "description": "Learning FastAPI and backend development",
            "progress_percentage": 50
        }
    )

    assert progress_response.status_code == 200

    progress_data = progress_response.json()

    assert progress_data["course_name"] == "FastAPI Development"
    assert progress_data["progress_percentage"] == 50
    assert progress_data["status"] == "in_progress"

    progress_id = progress_data["id"]

    # ==========================================
    # 3. GET ALL PROGRESS
    # ==========================================

    get_response = client.get(
        "/progress/",
        headers=headers
    )

    assert get_response.status_code == 200

    # ==========================================
    # 4. GET SINGLE PROGRESS
    # ==========================================

    single_response = client.get(
        f"/progress/{progress_id}",
        headers=headers
    )

    assert single_response.status_code == 200

    assert single_response.json()["id"] == progress_id

    # ==========================================
    # 5. UPDATE PROGRESS
    # ==========================================

    update_response = client.put(
        f"/progress/{progress_id}",
        headers=headers,
        json={
            "progress_percentage": 100,
            "status": "completed"
        }
    )

    assert update_response.status_code == 200

    updated_data = update_response.json()

    assert updated_data["progress_percentage"] == 100
    assert updated_data["status"] == "completed"

# ==========================================
# TEST NOTIFICATION API
# ==========================================

def test_notification_api():

    # ==========================================
    # 1. LOGIN
    # ==========================================

    login_response = client.post(
        "/auth/login",
        json={
            "email": "testintern123@example.com",
            "password": "Test@12345"
        }
    )

    assert login_response.status_code == 200

    token = login_response.json()["access_token"]

    headers = {
        "Authorization": f"Bearer {token}"
    }


    # ==========================================
    # 2. GET CURRENT USER
    # ==========================================

    me_response = client.get(
        "/auth/me",
        headers=headers
    )

    assert me_response.status_code == 200

    user_id = me_response.json()["id"]


    # ==========================================
    # 3. CREATE NOTIFICATION
    # ==========================================

    notification_response = client.post(
        "/notifications/",
        headers=headers,
        json={
            "user_id": user_id,
            "title": "Test Notification",
            "message": "This is a test notification.",
            "notification_type": "general"
        }
    )

    assert notification_response.status_code == 200

    notification = notification_response.json()

    assert "id" in notification
    assert notification["user_id"] == user_id
    assert notification["title"] == "Test Notification"
    assert notification["message"] == "This is a test notification."
    assert notification["notification_type"] == "general"
    assert notification["is_read"] == 0

    notification_id = notification["id"]


    # ==========================================
    # 4. GET MY NOTIFICATIONS
    # ==========================================

    notifications_response = client.get(
        "/notifications/",
        headers=headers
    )

    assert notifications_response.status_code == 200

    notifications = notifications_response.json()

    assert isinstance(notifications, list)

    assert any(
        item["id"] == notification_id
        for item in notifications
    )


    # ==========================================
    # 5. MARK NOTIFICATION AS READ
    # ==========================================

    read_response = client.put(
        f"/notifications/{notification_id}/read",
        headers=headers
    )

    assert read_response.status_code == 200

    read_notification = read_response.json()

    assert read_notification["id"] == notification_id
    assert read_notification["is_read"] == 1

# ==========================================
# TEST FILE MANAGEMENT API
# ==========================================

def test_file_api():

    # ==========================================
    # 1. LOGIN
    # ==========================================

    login_response = client.post(
        "/auth/login",
        json={
            "email": "testintern123@example.com",
            "password": "Test@12345"
        }
    )

    assert login_response.status_code == 200

    token = login_response.json()["access_token"]

    headers = {
        "Authorization": f"Bearer {token}"
    }


    # ==========================================
    # 2. UPLOAD FILE
    # ==========================================

    file_content = b"This is a test file for the AI Internship Agent."

    files = {
        "file": (
            "test_file.txt",
            file_content,
            "text/plain"
        )
    }

    upload_response = client.post(
        "/files/upload",
        headers=headers,
        files=files
    )

    assert upload_response.status_code == 200

    uploaded_file = upload_response.json()

    assert "id" in uploaded_file
    assert uploaded_file["filename"] == "test_file.txt"
    assert uploaded_file["user_id"] > 0
    assert uploaded_file["file_type"] == "text/plain"

    file_id = uploaded_file["id"]


    # ==========================================
    # 3. GET MY FILES
    # ==========================================

    files_response = client.get(
        "/files/",
        headers=headers
    )

    assert files_response.status_code == 200

    file_list = files_response.json()

    assert isinstance(file_list, list)

    assert any(
        item["id"] == file_id
        for item in file_list
    )


    # ==========================================
    # 4. GET SINGLE FILE
    # ==========================================

    single_file_response = client.get(
        f"/files/{file_id}",
        headers=headers
    )

    assert single_file_response.status_code == 200

    single_file = single_file_response.json()

    assert single_file["id"] == file_id
    assert single_file["filename"] == "test_file.txt"

# ==========================================
# TEST PROJECT PROGRESS API
# ==========================================

def test_project_progress_api():

    # ==========================================
    # 1. LOGIN
    # ==========================================

    login_response = client.post(
        "/auth/login",
        json={
            "email": "testintern123@example.com",
            "password": "Test@12345"
        }
    )

    assert login_response.status_code == 200

    token = login_response.json()["access_token"]

    headers = {
        "Authorization": f"Bearer {token}"
    }


    # ==========================================
    # 2. CREATE PROJECT PROGRESS
    # ==========================================

    # First get the intern's projects
    projects_response = client.get(
        "/projects/",
        headers=headers
    )

    assert projects_response.status_code == 200

    projects = projects_response.json()

    # Make sure at least one project exists
    assert len(projects) > 0

    project_id = projects[0]["id"]


    progress_response = client.post(
        "/project-progress/",
        headers=headers,
        json={
            "project_id": project_id,
            "progress_percentage": 50
        }
    )

    assert progress_response.status_code == 200

    progress = progress_response.json()

    assert "id" in progress
    assert progress["project_id"] == project_id
    assert progress["progress_percentage"] == 50
    assert progress["status"] == "in_progress"

    progress_id = progress["id"]


    # ==========================================
    # 3. GET MY PROJECT PROGRESS
    # ==========================================

    get_response = client.get(
        "/project-progress/",
        headers=headers
    )

    assert get_response.status_code == 200

    progress_list = get_response.json()

    assert isinstance(progress_list, list)

    assert any(
        item["id"] == progress_id
        for item in progress_list
    )


    # ==========================================
    # 4. GET SINGLE PROJECT PROGRESS
    # ==========================================

    single_response = client.get(
        f"/project-progress/{progress_id}",
        headers=headers
    )

    assert single_response.status_code == 200

    single_progress = single_response.json()

    assert single_progress["id"] == progress_id
    assert single_progress["progress_percentage"] == 50


    # ==========================================
    # 5. UPDATE PROJECT PROGRESS
    # ==========================================

    update_response = client.put(
        f"/project-progress/{progress_id}",
        headers=headers,
        json={
            "progress_percentage": 100
        }
    )

    assert update_response.status_code == 200

    updated_progress = update_response.json()

    assert updated_progress["id"] == progress_id
    assert updated_progress["progress_percentage"] == 100
    assert updated_progress["status"] == "completed"

# ==========================================
# TEST INTERNSHIP API
# ==========================================

def test_internship_api():

    # ==========================================
    # 1. LOGIN
    # ==========================================

    login_response = client.post(
        "/auth/login",
        json={
            "email": "testintern123@example.com",
            "password": "Test@12345"
        }
    )

    assert login_response.status_code == 200

    token = login_response.json()["access_token"]

    headers = {
        "Authorization": f"Bearer {token}"
    }


    # ==========================================
    # 2. CREATE INTERNSHIP
    # ==========================================

    internship_response = client.post(
        "/internships/",
        headers=headers,
        json={
            "title": "Python Backend Internship",
            "description": "Learn Python and FastAPI backend development",
            "required_skills": "Python, FastAPI, SQL",
            "duration": "3 months"
        }
    )

    assert internship_response.status_code == 200

    internship = internship_response.json()

    assert "id" in internship
    assert internship["title"] == "Python Backend Internship"
    assert internship["description"] == (
        "Learn Python and FastAPI backend development"
    )
    assert internship["required_skills"] == "Python, FastAPI, SQL"
    assert internship["duration"] == "3 months"
    assert internship["status"] == "active"

    internship_id = internship["id"]


    # ==========================================
    # 3. GET ALL INTERNSHIPS
    # ==========================================

    get_all_response = client.get(
        "/internships/",
        headers=headers
    )

    assert get_all_response.status_code == 200

    internships = get_all_response.json()

    assert isinstance(internships, list)

    assert any(
        item["id"] == internship_id
        for item in internships
    )


    # ==========================================
    # 4. GET SINGLE INTERNSHIP
    # ==========================================

    get_single_response = client.get(
        f"/internships/{internship_id}",
        headers=headers
    )

    assert get_single_response.status_code == 200

    single_internship = get_single_response.json()

    assert single_internship["id"] == internship_id
    assert single_internship["title"] == "Python Backend Internship"
    assert single_internship["status"] == "active"