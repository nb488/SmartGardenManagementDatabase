DROP TABLE Light;

DROP TABLE Nutrient;

DROP TABLE Water;

DROP TABLE MaintenanceLog;

DROP TABLE EnvironmentalDataPoint;

DROP TABLE Plant;

DROP TABLE Section;

DROP TABLE HasAccess;

DROP TABLE Tool;

DROP TABLE Garden;

DROP TABLE Location;

DROP TABLE SectionDimensions;

DROP TABLE PlantType;

DROP TABLE ToolType;

DROP TABLE PostalCode;

DROP TABLE Person;

CREATE TABLE Person (
	person_id INT PRIMARY KEY,
	name VARCHAR(200) NOT NULL
);

CREATE TABLE PostalCode (
	postal_code CHAR(6) PRIMARY KEY,
	province VARCHAR(200) NOT NULL,
	city VARCHAR(200) NOT NULL
);

CREATE TABLE ToolType (
	name VARCHAR(200) PRIMARY KEY,
	function VARCHAR(200) UNIQUE NOT NULL
);

CREATE TABLE PlantType (
	name VARCHAR(200) PRIMARY KEY,
	requirements VARCHAR(200),
	description VARCHAR(200) UNIQUE NOT NULL
);

CREATE TABLE SectionDimensions (
	length NUMBER, 
	width NUMBER,
	area NUMBER NOT NULL,
	PRIMARY KEY (length, width)
);

CREATE TABLE Location (
	postal_code CHAR(6),
	house_number INT,
	street_name VARCHAR(200),
	PRIMARY KEY (postal_code, house_number, street_name),
	FOREIGN KEY (postal_code) REFERENCES PostalCode
);

CREATE TABLE Garden (
	garden_id INT PRIMARY KEY,
	name VARCHAR(200) NOT NULL,
	postal_code CHAR(6) NOT NULL,
	street_name VARCHAR(200) NOT NULL,
	house_number INT NOT NULL,
	owner_id INT NOT NULL,
	FOREIGN KEY (postal_code, house_number, street_name) REFERENCES Location,
	FOREIGN KEY (owner_id) REFERENCES Person(person_id)
);

CREATE TABLE Tool (
	tool_id INT PRIMARY KEY,
	date_added DATE NOT NULL,
	garden_id INT NOT NULL,
	type_name VARCHAR(200) NOT NULL,
	FOREIGN KEY (garden_id) REFERENCES Garden,
	FOREIGN KEY (type_name) REFERENCES ToolType(name)
);

CREATE TABLE HasAccess (
	garden_id INT,
	person_id INT,
	PRIMARY KEY (garden_id, person_id),
	FOREIGN KEY (garden_id) REFERENCES Garden,
	FOREIGN KEY (person_id) REFERENCES Person
);

CREATE TABLE Section (
	section_id INT PRIMARY KEY, 
	garden_id INT NOT NULL,
	latitude NUMBER NOT NULL,
	longitude NUMBER NOT NULL, 
	length NUMBER NOT NULL,
	width NUMBER NOT NULL,
	FOREIGN KEY (garden_id) REFERENCES Garden, 
	FOREIGN KEY (length, width) REFERENCES SectionDimensions
);

CREATE TABLE Plant (
	plant_id INT PRIMARY KEY,
	latitude NUMBER NOT NULL,
	longitude NUMBER NOT NULL,
	radius NUMBER NOT NULL,
	is_ready INT NOT NULL,
	type_name VARCHAR(200) NOT NULL,
	section_id INT NOT NULL,
	FOREIGN KEY (type_name) REFERENCES PlantType(name),
	FOREIGN KEY (section_id) REFERENCES Section
);

CREATE TABLE EnvironmentalDataPoint (
	timestamp TIMESTAMP,
	section_id INT,
	temperature NUMBER,
	moisture NUMBER,
	pH NUMBER,
	PRIMARY KEY (timestamp, section_id),
	FOREIGN KEY (section_id) REFERENCES Section
);
-- foreign key section_id should have ON DELETE CASCADE ON UPDATE CASCADE even though oracle doesn’t support this
-- this is a weak entity so it depends upon the owner entity for identification, in the case that a tuple from 
-- the owner is deleted, the associated row in the weak entity table no longer has any meaning/context and 
-- should also be removed.

CREATE TABLE MaintenanceLog (
	maintenance_log_id INT PRIMARY KEY, 
	timestamp TIMESTAMP NOT NULL, 
	entry VARCHAR(200) NOT NULL, 
	section_id INT NOT NULL,
	FOREIGN KEY (section_id) REFERENCES Section	
);

CREATE TABLE Water (
	resource_usage_data_point_id INT PRIMARY KEY,
	timestamp TIMESTAMP NOT NULL,
	volume_litres NUMBER NOT NULL,
	section_id INT NOT NULL,
	FOREIGN KEY (section_id) REFERENCES Section
);

CREATE TABLE Nutrient (
	resource_usage_data_point_id INT PRIMARY KEY,
	timestamp TIMESTAMP NOT NULL,
	nitrogen_grams NUMBER,
	potassium_grams NUMBER,
	phosphorus_grams NUMBER,
	section_id INT NOT NULL,
	FOREIGN KEY (section_id) REFERENCES Section
);

CREATE TABLE Light (
	resource_usage_data_point_id INT PRIMARY KEY,
	timestamp TIMESTAMP NOT NULL,
	intensity_lux NUMBER NOT NULL,
	duration_mins NUMBER NOT NULL,
	type VARCHAR(200) NOT NULL,
	section_id INT NOT NULL,
	FOREIGN KEY (section_id) REFERENCES Section
);

-- insert into statements below:

-- 1. Person 
INSERT INTO Person (person_id, name) VALUES (1, 'Sarah Johnson');
INSERT INTO Person (person_id, name) VALUES (2, 'Michael Chen');
INSERT INTO Person (person_id, name) VALUES (3, 'Emily Rodriguez');
INSERT INTO Person (person_id, name) VALUES (4, 'David Thompson');
INSERT INTO Person (person_id, name) VALUES (5, 'Jessica Williams');
INSERT INTO Person (person_id, name) VALUES (6, 'Robert Martinez');
INSERT INTO Person (person_id, name) VALUES (7, 'Amanda Lee');

-- 2. PostalCode
INSERT INTO PostalCode (postal_code, province, city) 
VALUES ('V6T1Z4', 'British Columbia', 'Vancouver');
INSERT INTO PostalCode (postal_code, province, city) 
VALUES ('V5K0A1', 'British Columbia', 'Vancouver');
INSERT INTO PostalCode (postal_code, province, city) 
VALUES ('V7M2E3', 'British Columbia', 'North Vancouver');
INSERT INTO PostalCode (postal_code, province, city) 
VALUES ('V3H4K6', 'British Columbia', 'Burnaby');
INSERT INTO PostalCode (postal_code, province, city) 
VALUES ('V6B1A1', 'British Columbia', 'Vancouver');
INSERT INTO PostalCode (postal_code, province, city) 
VALUES ('V4N3M2', 'British Columbia', 'Richmond');

-- 3. ToolType 
INSERT INTO ToolType (name, function) 
VALUES ('Shovel', 'Digging into soil');
INSERT INTO ToolType (name, function) 
VALUES ('Rake', 'Gathering leaves or leveling soil');
INSERT INTO ToolType (name, function) 
VALUES ('Pruning Shears', 'Trimming and shaping plants');
INSERT INTO ToolType (name, function) 
VALUES ('Watering Can', 'Manual watering of plants');
INSERT INTO ToolType (name, function) 
VALUES ('Hoe', 'Breaking up soil');
INSERT INTO ToolType (name, function) 
VALUES ('Trowel', 'Small-scale digging and planting');
INSERT INTO ToolType (name, function) 
VALUES ('Garden Fork', 'Turning and aerating compost');

-- 4. PlantType 
INSERT INTO PlantType (name, requirements, description) VALUES ('Tomato', 'Full sun, regular watering, pH 6.0-6.8', 'make into sauces for pasta');
INSERT INTO PlantType (name, requirements, description) VALUES ('Lettuce', 'Partial shade, consistent moisture, pH 6.0-7.0', 'used for salads');
INSERT INTO PlantType (name, requirements, description) VALUES ('Carrot', 'Full sun, loose soil, pH 6.0-6.8', 'root vegetable good for soups');
INSERT INTO PlantType (name, requirements, description) VALUES ('Basil', 'Full sun, warm temperatures, pH 6.0-7.0', 'herb plant');
INSERT INTO PlantType (name, requirements, description) VALUES ('Cucumber', 'Full sun, consistent watering, pH 6.0-7.0', 'great veggie to dip in hummus');
INSERT INTO PlantType (name, requirements, description) VALUES ('Bell Pepper', 'Full sun, warm soil, pH 6.0-6.8', 'not very spicy pepper, comes in red, green, orange, and yellow');
INSERT INTO PlantType (name, requirements, description) VALUES ('Strawberry', 'Full sun, well-drained soil, pH 5.5-6.5', 'yummy berry good in cakes');

-- 5. SectionDimensions
INSERT INTO SectionDimensions(length, width, area) VALUES (10.5,  9.3, 97.65);
INSERT INTO SectionDimensions(length, width, area) VALUES (5.5, 12.92, 71.06);
INSERT INTO SectionDimensions(length, width, area) VALUES (7.3, 8.12, 59.276);
INSERT INTO SectionDimensions(length, width, area) VALUES (10.9, 11.4, 124.26);
INSERT INTO SectionDimensions(length, width, area) VALUES (12.5, 11.7, 146.25);

-- 6. Location
INSERT INTO Location (postal_code, house_number, street_name) VALUES ('V6T1Z4', 2329, 'West Mall');
INSERT INTO Location (postal_code, house_number, street_name) VALUES ('V5K0A1', 1234, 'Commercial Drive');
INSERT INTO Location (postal_code, house_number, street_name) VALUES ('V7M2E3', 567, 'Lonsdale Avenue');
INSERT INTO Location (postal_code, house_number, street_name) VALUES ('V3H4K6', 8900, 'Eastlake Drive');
INSERT INTO Location (postal_code, house_number, street_name) VALUES ('V6B1A1', 456, 'Granville Street');
INSERT INTO Location (postal_code, house_number, street_name) VALUES ('V4N3M2', 7890, 'Garden City Road');

-- 7. Garden
INSERT INTO Garden (garden_id, name, postal_code, street_name, house_number, owner_id) 
VALUES (1, 'UBC Community Garden', 'V6T1Z4', 'West Mall', 2329, 1);

INSERT INTO Garden (garden_id, name, postal_code, street_name, house_number, owner_id) 
VALUES (2, 'Sunrise Urban Farm', 'V5K0A1', 'Commercial Drive', 1234, 2);

INSERT INTO Garden (garden_id, name, postal_code, street_name, house_number, owner_id) 
VALUES (3, 'North Shore Garden Haven', 'V7M2E3', 'Lonsdale Avenue', 567, 3);

INSERT INTO Garden (garden_id, name, postal_code, street_name, house_number, owner_id) 
VALUES (4, 'Burnaby Heights Garden', 'V3H4K6', 'Eastlake Drive', 8900, 4);

INSERT INTO Garden (garden_id, name, postal_code, street_name, house_number, owner_id) 
VALUES (5, 'Downtown Rooftop Garden', 'V6B1A1', 'Granville Street', 456, 5);

INSERT INTO Garden (garden_id, name, postal_code, street_name, house_number, owner_id) 
VALUES (6, 'Richmond Family Garden', 'V4N3M2', 'Garden City Road', 7890, 6);

-- 8. Tool 
INSERT INTO Tool (tool_id, date_added, garden_id, type_name) 
VALUES (1, DATE '2024-03-15', 1, 'Shovel');

INSERT INTO Tool (tool_id, date_added, garden_id, type_name) 
VALUES (2, DATE '2024-03-15', 1, 'Rake');

INSERT INTO Tool (tool_id, date_added, garden_id, type_name) 
VALUES (3, DATE '2024-04-01', 1, 'Watering Can');

INSERT INTO Tool (tool_id, date_added, garden_id, type_name) 
VALUES (4, DATE '2024-02-10', 2, 'Pruning Shears');

INSERT INTO Tool (tool_id, date_added, garden_id, type_name) 
VALUES (5, DATE '2024-03-20', 2, 'Hoe');

INSERT INTO Tool (tool_id, date_added, garden_id, type_name) 
VALUES (6, DATE '2024-01-05', 3, 'Trowel');

INSERT INTO Tool (tool_id, date_added, garden_id, type_name) 
VALUES (7, DATE '2024-03-10', 3, 'Garden Fork');

INSERT INTO Tool (tool_id, date_added, garden_id, type_name) 
VALUES (8, DATE '2024-04-15', 4, 'Shovel');

INSERT INTO Tool (tool_id, date_added, garden_id, type_name) 
VALUES (9, DATE '2024-05-01', 5, 'Watering Can');

-- 9. HasAccess
INSERT INTO HasAccess (garden_id, person_id) VALUES (1, 1);
INSERT INTO HasAccess (garden_id, person_id) VALUES (1, 2);
INSERT INTO HasAccess (garden_id, person_id) VALUES (1, 7);
INSERT INTO HasAccess (garden_id, person_id) VALUES (2, 2);
INSERT INTO HasAccess (garden_id, person_id) VALUES (2, 3);
INSERT INTO HasAccess (garden_id, person_id) VALUES (3, 3);
INSERT INTO HasAccess (garden_id, person_id) VALUES (3, 4);
INSERT INTO HasAccess (garden_id, person_id) VALUES (4, 4);
INSERT INTO HasAccess (garden_id, person_id) VALUES (5, 5);
INSERT INTO HasAccess (garden_id, person_id) VALUES (6, 6);

-- 10. Section 
INSERT INTO Section (section_id, garden_id, latitude, longitude, length, width) 
VALUES (1, 1, 49.2606, -123.2460, 10.5, 9.3);

INSERT INTO Section (section_id, garden_id, latitude, longitude, length, width) 
VALUES (2, 1, 49.2608, -123.2462, 5.5, 12.92);

INSERT INTO Section (section_id, garden_id, latitude, longitude, length, width) 
VALUES (3, 2, 49.2698, -123.0693, 7.3, 8.12);

INSERT INTO Section (section_id, garden_id, latitude, longitude, length, width) 
VALUES (4, 2, 49.2700, -123.0695, 10.9, 11.4);

INSERT INTO Section (section_id, garden_id, latitude, longitude, length, width) 
VALUES (5, 3, 49.3163, -123.0755, 12.5, 11.7);

INSERT INTO Section (section_id, garden_id, latitude, longitude, length, width) 
VALUES (6, 4, 49.2488, -122.9805, 5.5, 12.92);

INSERT INTO Section (section_id, garden_id, latitude, longitude, length, width) 
VALUES (7, 5, 49.2827, -123.1207, 7.3, 8.12);

-- 11. Plant 
INSERT INTO Plant (plant_id, latitude, longitude, radius, is_ready, type_name, section_id) 
VALUES (1, 49.2606, -123.2460, 0.3, 1, 'Tomato', 1);

INSERT INTO Plant (plant_id, latitude, longitude, radius, is_ready, type_name, section_id) 
VALUES (2, 49.2606, -123.2461, 0.25, 1, 'Tomato', 1);

INSERT INTO Plant (plant_id, latitude, longitude, radius, is_ready, type_name, section_id) 
VALUES (3, 49.2607, -123.2460, 0.2, 0, 'Basil', 1);

INSERT INTO Plant (plant_id, latitude, longitude, radius, is_ready, type_name, section_id) 
VALUES (4, 49.2608, -123.2462, 0.15, 1, 'Lettuce', 2);

INSERT INTO Plant (plant_id, latitude, longitude, radius, is_ready, type_name, section_id) 
VALUES (5, 49.2608, -123.2463, 0.15, 1, 'Lettuce', 2);

INSERT INTO Plant (plant_id, latitude, longitude, radius, is_ready, type_name, section_id) 
VALUES (6, 49.2698, -123.0693, 0.25, 0, 'Carrot', 3);

INSERT INTO Plant (plant_id, latitude, longitude, radius, is_ready, type_name, section_id) 
VALUES (7, 49.2699, -123.0694, 0.3, 1, 'Cucumber', 3);

INSERT INTO Plant (plant_id, latitude, longitude, radius, is_ready, type_name, section_id) 
VALUES (8, 49.2700, -123.0695, 0.25, 0, 'Bell Pepper', 4);

INSERT INTO Plant (plant_id, latitude, longitude, radius, is_ready, type_name, section_id) 
VALUES (9, 49.3163, -123.0755, 0.2, 1, 'Strawberry', 5);

INSERT INTO Plant (plant_id, latitude, longitude, radius, is_ready, type_name, section_id) 
VALUES (10, 49.2488, -122.9805, 0.3, 1, 'Tomato', 6);

-- 12. EnvironmentalDataPoint 
INSERT INTO EnvironmentalDataPoint (timestamp, section_id, temperature, moisture, pH) 
VALUES (TIMESTAMP '2024-10-01 08:00:00', 1, 22.5, 65.0, 6.5);

INSERT INTO EnvironmentalDataPoint (timestamp, section_id, temperature, moisture, pH) 
VALUES (TIMESTAMP '2024-10-01 14:00:00', 1, 25.8, 58.0, 6.4);

INSERT INTO EnvironmentalDataPoint (timestamp, section_id, temperature, moisture, pH) 
VALUES (TIMESTAMP '2024-10-02 08:00:00', 1, 21.3, 70.0, 6.6);

INSERT INTO EnvironmentalDataPoint (timestamp, section_id, temperature, moisture, pH) 
VALUES (TIMESTAMP '2024-10-01 08:00:00', 2, 23.1, 62.0, 6.8);

INSERT INTO EnvironmentalDataPoint (timestamp, section_id, temperature, moisture, pH) 
VALUES (TIMESTAMP '2024-10-01 08:00:00', 3, 24.0, 55.0, 6.2);

INSERT INTO EnvironmentalDataPoint (timestamp, section_id, temperature, moisture, pH) 
VALUES (TIMESTAMP '2024-10-01 08:00:00', 4, 22.8, 60.0, 6.7);

INSERT INTO EnvironmentalDataPoint (timestamp, section_id, temperature, moisture, pH) 
VALUES (TIMESTAMP '2024-10-01 08:00:00', 5, 20.5, 68.0, 5.8);

-- 13. MaintenanceLog 
INSERT INTO MaintenanceLog (maintenance_log_id, timestamp, entry, section_id) 
VALUES (1, TIMESTAMP '2024-09-15 10:30:00', 'weeded entire section and added nutrients to tomato plants', 1);

INSERT INTO MaintenanceLog (maintenance_log_id, timestamp, entry, section_id) 
VALUES (2, TIMESTAMP '2024-09-20 14:15:00', 'pruned tomato plants and removed diseased leaves', 1);

INSERT INTO MaintenanceLog (maintenance_log_id, timestamp, entry, section_id) 
VALUES (3, TIMESTAMP '2024-09-22 14:15:00', 'harvested lettuce heads, replanted new seedlings', 2);

INSERT INTO MaintenanceLog (maintenance_log_id, timestamp, entry, section_id) 
VALUES (4, TIMESTAMP '2024-09-25 11:45:00', 'applied organic fertilizer to cucumber vines', 3);

INSERT INTO MaintenanceLog (maintenance_log_id, timestamp, entry, section_id) 
VALUES (5, TIMESTAMP '2024-09-28 16:20:00', 'installed trellis system for cucumber plants', 3);

INSERT INTO MaintenanceLog (maintenance_log_id, timestamp, entry, section_id) 
VALUES (6, TIMESTAMP '2024-10-01 08:30:00', 'treated bell peppers for aphid infestation using neem oil', 4);

INSERT INTO MaintenanceLog (maintenance_log_id, timestamp, entry, section_id) 
VALUES (7, TIMESTAMP '2024-10-03 08:30:00', 'removed strawberry runners and composted old leaves', 5);

-- 14. Water 
INSERT INTO Water (resource_usage_data_point_id, timestamp, volume_litres, section_id) 
VALUES (1, TIMESTAMP '2024-10-01 07:00:00', 45.5, 1);

INSERT INTO Water (resource_usage_data_point_id, timestamp, volume_litres, section_id) 
VALUES (2, TIMESTAMP '2024-10-01 19:00:00', 38.2, 1);

INSERT INTO Water (resource_usage_data_point_id, timestamp, volume_litres, section_id) 
VALUES (3, TIMESTAMP '2024-10-02 07:00:00', 42.0, 1);

INSERT INTO Water (resource_usage_data_point_id, timestamp, volume_litres, section_id) 
VALUES (4, TIMESTAMP '2024-10-01 07:00:00', 25.5, 2);

INSERT INTO Water (resource_usage_data_point_id, timestamp, volume_litres, section_id) 
VALUES (5, TIMESTAMP '2024-10-01 07:00:00', 65.0, 3);

INSERT INTO Water (resource_usage_data_point_id, timestamp, volume_litres, section_id) 
VALUES (6, TIMESTAMP '2024-10-01 07:00:00', 80.5, 4);

INSERT INTO Water (resource_usage_data_point_id, timestamp, volume_litres, section_id) 
VALUES (7, TIMESTAMP '2024-10-01 07:00:00', 15.0, 5);

-- 15. Nutrient 
INSERT INTO Nutrient (resource_usage_data_point_id, timestamp, nitrogen_grams, potassium_grams, phosphorus_grams, section_id) 
VALUES (1, TIMESTAMP '2024-09-15 10:00:00', 150.0, NULL, NULL, 1);

INSERT INTO Nutrient (resource_usage_data_point_id, timestamp, nitrogen_grams, potassium_grams, phosphorus_grams, section_id) 
VALUES (2, TIMESTAMP '2024-09-22 10:00:00', 120.0, NULL, 70.0, 2);

INSERT INTO Nutrient (resource_usage_data_point_id, timestamp, nitrogen_grams, potassium_grams, phosphorus_grams, section_id) 
VALUES (3, TIMESTAMP '2024-09-25 11:00:00', NULL, 120.0, 95.0, 3);

INSERT INTO Nutrient (resource_usage_data_point_id, timestamp, nitrogen_grams, potassium_grams, phosphorus_grams, section_id) 
VALUES (4, TIMESTAMP '2024-09-28 10:00:00', 200.0, 140.0, 110.0, 4);

INSERT INTO Nutrient (resource_usage_data_point_id, timestamp, nitrogen_grams, potassium_grams, phosphorus_grams, section_id) 
VALUES (5, TIMESTAMP '2024-09-30 09:00:00', NULL, NULL, 50.0, 5);

INSERT INTO Nutrient (resource_usage_data_point_id, timestamp, nitrogen_grams, potassium_grams, phosphorus_grams, section_id) 
VALUES (6, TIMESTAMP '2024-10-02 10:00:00', 160.0, 110.0, NULL, 6);

-- 16. Light 
INSERT INTO Light (resource_usage_data_point_id, timestamp, intensity_lux, duration_mins, type, section_id) 
VALUES (1, TIMESTAMP '2024-10-01 12:00:00', 85000, 480, 'Natural Sunlight', 1);

INSERT INTO Light (resource_usage_data_point_id, timestamp, intensity_lux, duration_mins, type, section_id) 
VALUES (2, TIMESTAMP '2024-10-01 12:00:00', 78000, 420, 'Natural Sunlight', 2);

INSERT INTO Light (resource_usage_data_point_id, timestamp, intensity_lux, duration_mins, type, section_id) 
VALUES (3, TIMESTAMP '2024-10-01 12:00:00', 92000, 510, 'Natural Sunlight', 3);

INSERT INTO Light (resource_usage_data_point_id, timestamp, intensity_lux, duration_mins, type, section_id) 
VALUES (4, TIMESTAMP '2024-10-01 20:00:00', 15000, 240, 'LED Grow Light', 5);

INSERT INTO Light (resource_usage_data_point_id, timestamp, intensity_lux, duration_mins, type, section_id) 
VALUES (5, TIMESTAMP '2024-10-01 12:00:00', 88000, 465, 'Natural Sunlight', 6);

INSERT INTO Light (resource_usage_data_point_id, timestamp, intensity_lux, duration_mins, type, section_id) 
VALUES (6, TIMESTAMP '2024-10-01 18:00:00', 25000, 360, 'LED Grow Light', 7);


