from typing import Optional, List
from pydantic import BaseModel, field_validator
import json

class LabOut(BaseModel):
    id: str
    title: str
    category: str
    difficulty: str
    time: str
    points: int
    participants: int
    description: str
    long_description: Optional[str] = None
    objectives: List[str] = []
    prerequisites: List[str] = []
    hints: List[str] = []
    tools: List[str] = []
    environment: Optional[str] = None
    tags: List[str] = []
    completed: bool
    featured: bool
    docker_image: str
    docker_port: int
    
    @field_validator('tags', mode='before')
    @classmethod
    def parse_tags(cls, v):
        if isinstance(v, str):
            return [tag.strip() for tag in v.split(',') if tag.strip()]
        return v or []
    
    @field_validator('objectives', 'prerequisites', 'hints', 'tools', mode='before')
    @classmethod
    def parse_json_array(cls, v):
        if isinstance(v, str) and v:
            try:
                return json.loads(v)
            except:
                return []
        return v or []

    class Config:
        from_attributes = True

class LabCreate(BaseModel):
    id: str
    title: str
    category: str
    difficulty: str
    time: str
    points: int
    participants: int
    description: str
    docker_image: str
    docker_port: int = 5200
    tags: list[str]
    completed: bool
    featured: bool
    long_description: Optional[str] = None
    objectives: Optional[List[str]] = []
    prerequisites: Optional[List[str]] = []
    hints: Optional[List[str]] = []
    tools: Optional[List[str]] = []
    environment: Optional[str] = None

class Announcement(BaseModel):
    title: str
    content: str
    time :str
    type: str
    url: Optional[str] = None
