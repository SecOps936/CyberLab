import docker
import random
from uuid import uuid4
from fastapi import HTTPException
from backend.models.lab import Lab

try:
    client = docker.from_env()
    # Test the connection
    client.ping()
    print(" Docker client connected successfully")
except Exception as e:
    print(f"Warning: Docker client could not be initialized: {e}")
    client = None

# Track used ports to avoid conflicts
used_ports = set()

def get_available_port(start_port=30000, end_port=31000):
    """Get an available port that's not already in use"""
    available_ports = set(range(start_port, end_port)) - used_ports
    if not available_ports:
        # Reset if all ports are used
        used_ports.clear()
        available_ports = set(range(start_port, end_port))

    port = random.choice(list(available_ports))
    used_ports.add(port)
    return port

def start_lab_container(lab: Lab):
    """
    Start a Docker container for the lab
    Returns: (container_id, port)
    """
    if not client:
        raise HTTPException(status_code=500, detail="Docker client is not available. Please ensure Docker is running.")

    # Get an available port on the host
    host_port = get_available_port()

    # The container's internal port (default to 80 if not set)
    container_port = lab.docker_port if hasattr(lab, 'docker_port') and lab.docker_port else 80

    print(f"Starting container for lab: {lab.title}")
    print(f"   Image: {lab.docker_image}")
    print(f"   Container port: {container_port}")
    print(f"   Host port: {host_port}")

    try:
        # Check if image exists locally, if not pull it
        try:
            client.images.get(lab.docker_image)
            print(f"   Image found locally")
        except docker.errors.ImageNotFound:
            print(f"   Pulling image {lab.docker_image}...")
            client.images.pull(lab.docker_image)
            print(f"   Image pulled successfully")

        # Create container name
        container_name = f"{lab.title.replace(' ', '-').lower()}-{uuid4().hex[:6]}"

        # Run the container with correct port mapping
        container = client.containers.run(
            image=lab.docker_image,
            name=container_name,
            ports={f"{container_port}/tcp": host_port},  # Map container port to host port
            detach=True,
            labels={"lab_id": lab.id, "lab_title": lab.title},
            mem_limit="512m",  # Limit memory usage
            auto_remove=True  # Auto-remove container when stopped
        )

        print(f"Container started successfully!")
        print(f"   Container ID: {container.id[:12]}")
        print(f"   Access at: http://localhost:{host_port}")

        return container.id, host_port

    except docker.errors.ImageNotFound:
        raise HTTPException(status_code=404, detail=f"Docker image '{lab.docker_image}' not found. Please check the image name.")
    except docker.errors.APIError as e:
        raise HTTPException(status_code=500, detail=f"Docker API error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start container: {str(e)}")

def stop_lab_container(container_id: str):
    """Stop and remove a Docker container"""
    if not client:
        print("Docker client not available, cannot stop container")
        return

    try:
        container = client.containers.get(container_id)
        container.stop()
        print(f"Container stopped: {container_id[:12]}")

        # Free up the port that was used
        # Note: We don't know which port was used here, so we'll rely on the
        # scheduler to clean up used_ports periodically
    except docker.errors.NotFound:
        print(f"Container {container_id[:12]} not found (already stopped)")
    except Exception as e:
        print(f"Error stopping container {container_id}: {e}")

def get_container_status(container_id: str):
    """Get the status of a container"""
    if not client:
        return {"status": "unavailable", "error": "Docker not available"}

    try:
        container = client.containers.get(container_id)
        container.reload()
        return {
            "status": container.status,
            "created": container.attrs.get("Created"),
            "started_at": container.attrs.get("State", {}).get("StartedAt")
        }
    except docker.errors.NotFound:
        return {"status": "not_found"}
    except Exception as e:
        return {"status": "error", "error": str(e)}

def list_running_containers():
    """List all running containers (for debugging)"""
    if not client:
        return []

    containers = client.containers.list()
    return [
        {
            "id": c.id[:12],
            "name": c.name,
            "status": c.status,
            "image": c.image.tags[0] if c.image.tags else "unknown"
        }
        for c in containers
    ]
