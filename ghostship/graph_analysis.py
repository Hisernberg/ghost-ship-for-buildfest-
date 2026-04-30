"""Graph-based relationship analysis for GhostShip."""

from typing import Dict, List, Optional, Set
from dataclasses import dataclass

# Optional Neo4j integration
try:
    from py2neo import Graph, Node, Relationship
except ImportError:
    Graph = None


@dataclass
class Entity:
    """Company or person entity."""
    id: str
    name: str
    type: str  # "company" or "person"
    country: Optional[str] = None
    risk_score: float = 0.0
    is_watchlisted: bool = False


@dataclass
class Relationship:
    """Relationship between entities."""
    source_id: str
    target_id: str
    type: str  # "owns", "directs", "linked", "shares_address"
    strength: float = 1.0  # 0.0 to 1.0


class RelationshipGraph:
    """In-memory graph for relationship analysis (fallback if Neo4j not available)."""
    
    def __init__(self):
        self.nodes: Dict[str, Entity] = {}
        self.edges: Dict[str, List[Relationship]] = {}
        self._neo4j_graph = None
        
        if Graph is not None:
            try:
                self._neo4j_graph = Graph("bolt://localhost:7687", auth=("neo4j", "password"))
            except Exception:
                pass  # Fall back to in-memory
    
    def add_entity(self, entity: Entity):
        """Add entity to graph."""
        self.nodes[entity.id] = entity
        if entity.id not in self.edges:
            self.edges[entity.id] = []
        
        # Also add to Neo4j if available
        if self._neo4j_graph:
            node = Node(entity.type, id=entity.id, name=entity.name, 
                       country=entity.country, risk_score=entity.risk_score)
            self._neo4j_graph.merge(node, entity.type, "id")
    
    def add_relationship(self, rel: Relationship):
        """Add relationship between entities."""
        if rel.source_id not in self.edges:
            self.edges[rel.source_id] = []
        self.edges[rel.source_id].append(rel)
        
        # Also add to Neo4j if available
        if self._neo4j_graph:
            source = self._neo4j_graph.nodes.match(id=rel.source_id).first()
            target = self._neo4j_graph.nodes.match(id=rel.target_id).first()
            if source and target:
                rel_type = Relationship.type(rel.type.upper())
                rel_obj = Relationship(source, rel_type, target, strength=rel.strength)
                self._neo4j_graph.merge(rel_obj)
    
    def find_linked_entities(self, entity_id: str, depth: int = 2) -> Set[str]:
        """Find all entities linked within N degrees of separation."""
        visited = set()
        current_level = {entity_id}
        
        for _ in range(depth):
            next_level = set()
            for entity in current_level:
                if entity in visited:
                    continue
                visited.add(entity)
                for rel in self.edges.get(entity, []):
                    next_level.add(rel.target_id)
            current_level = next_level
        
        return visited - {entity_id}
    
    def find_shared_directors(self, company_a: str, company_b: str) -> List[str]:
        """Find directors shared between two companies."""
        directors_a = {
            rel.target_id for rel in self.edges.get(company_a, [])
            if rel.type == "directs"
        }
        directors_b = {
            rel.target_id for rel in self.edges.get(company_b, [])
            if rel.type == "directs"
        }
        return list(directors_a & directors_b)
    
    def detect_circular_ownership(self, entity_id: str, max_depth: int = 5) -> Optional[List[str]]:
        """Detect circular ownership patterns (shell company indicator)."""
        def dfs(current: str, target: str, path: List[str], depth: int) -> Optional[List[str]]:
            if depth > max_depth:
                return None
            if current == target and len(path) > 1:
                return path + [current]
            
            for rel in self.edges.get(current, []):
                if rel.type == "owns" and rel.target_id not in path[:-1]:
                    result = dfs(rel.target_id, target, path + [current], depth + 1)
                    if result:
                        return result
            return None
        
        return dfs(entity_id, entity_id, [], 0)
    
    def calculate_network_risk(self, entity_id: str) -> float:
        """Calculate risk score based on network connections."""
        linked = self.find_linked_entities(entity_id, depth=2)
        if not linked:
            return 0.0
        
        total_risk = 0.0
        watchlist_count = 0
        
        for linked_id in linked:
            entity = self.nodes.get(linked_id)
            if entity:
                total_risk += entity.risk_score
                if entity.is_watchlisted:
                    watchlist_count += 1
        
        # Weight by watchlist presence
        avg_risk = total_risk / len(linked)
        watchlist_penalty = min(watchlist_count * 0.2, 0.5)
        
        return min(avg_risk + watchlist_penalty, 1.0)
    
    def find_shell_company_indicators(self, entity_id: str) -> Dict[str, any]:
        """Detect potential shell company patterns."""
        indicators = {
            "circular_ownership": None,
            "nominee_directors": [],
            "shared_address_companies": [],
            "risk_score": 0.0
        }
        
        # Check for circular ownership
        circular = self.detect_circular_ownership(entity_id)
        if circular:
            indicators["circular_ownership"] = circular
        
        # Check for directors serving many companies
        for rel in self.edges.get(entity_id, []):
            if rel.type == "directs":
                director_companies = [
                    r.source_id for r in self.edges.get(rel.target_id, [])
                    if r.type == "directs"
                ]
                if len(director_companies) > 5:  # Threshold for nominee
                    indicators["nominee_directors"].append({
                        "director_id": rel.target_id,
                        "company_count": len(director_companies)
                    })
        
        # Calculate network risk
        indicators["risk_score"] = self.calculate_network_risk(entity_id)
        
        return indicators


# Global intelligence data
class GlobalIntelligence:
    """Route and country risk intelligence."""
    
    # Static data (would come from APIs in production)
    COUNTRY_RISK_SCORES = {
        "SG": 15,  # Singapore - low risk
        "AE": 35,  # UAE - medium risk
        "IR": 85,  # Iran - high risk (sanctions)
        "KP": 95,  # North Korea - very high risk
        "CN": 45,  # China - medium risk
        "IN": 40,  # India - medium risk
    }
    
    PORT_CONGESTION = {
        "SINGAPORE": 0.3,    # Low congestion
        "MUMBAI": 0.6,       # Medium congestion
        "SHANGHAI": 0.5,
        "COLOMBO": 0.8,      # High congestion
    }
    
    @classmethod
    def get_route_risk(cls, origin: str, destination: str, 
                       transit_countries: List[str] = None) -> Dict:
        """Calculate route risk score."""
        origin_risk = cls.COUNTRY_RISK_SCORES.get(origin, 50)
        dest_risk = cls.COUNTRY_RISK_SCORES.get(destination, 50)
        
        transit_risks = [
            cls.COUNTRY_RISK_SCORES.get(c, 50) 
            for c in (transit_countries or [])
        ]
        
        # Weight: origin 20%, destination 30%, transit 50%
        avg_transit = sum(transit_risks) / len(transit_risks) if transit_risks else 50
        total_risk = (origin_risk * 0.2 + dest_risk * 0.3 + avg_transit * 0.5)
        
        return {
            "total_risk_score": round(total_risk),
            "origin_risk": origin_risk,
            "destination_risk": dest_risk,
            "transit_risks": transit_risks,
            "risk_level": "HIGH" if total_risk > 70 else "MEDIUM" if total_risk > 40 else "LOW"
        }
    
    @classmethod
    def get_port_congestion(cls, port: str) -> Dict:
        """Get port congestion status."""
        congestion = cls.PORT_CONGESTION.get(port.upper(), 0.5)
        return {
            "congestion_score": congestion,
            "status": "HIGH" if congestion > 0.7 else "MEDIUM" if congestion > 0.4 else "LOW",
            "estimated_delay_hours": round(congestion * 48)  # Max 48h delay
        }


# Entity history tracking
class EntityHistory:
    """Track historical patterns for entities."""
    
    def __init__(self, db_connection=None):
        self.db = db_connection
    
    def get_shipment_history(self, company_id: str, days: int = 90) -> List[Dict]:
        """Get past shipments for a company."""
        # Would query PostgreSQL in production
        # For now, return mock data structure
        return [
            {
                "shipment_id": f"SHP-{i:06d}",
                "date": "2024-03-01",
                "commodity": "electronics",
                "risk_score": 45,
                "status": "CLEARED"
            }
            for i in range(36)  # Mock 36 filings
        ]
    
    def get_risk_trend(self, company_id: str) -> Dict:
        """Analyze risk score trend over time."""
        # Would calculate from historical data
        return {
            "trend": "INCREASING",
            "current_score": 68,
            "previous_score": 45,
            "change_percent": 51,
            "pattern": "Document deviations rising on this trade lane"
        }
    
    def get_inspection_outcomes(self, company_id: str) -> Dict:
        """Get historical inspection results."""
        return {
            "total_inspections": 12,
            "violations_found": 3,
            "violation_rate": 0.25,
            "last_inspection": "2024-02-15",
            "common_issues": ["Document mismatch", "Value discrepancy"]
        }
