-- Trigger function to update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW(); -- set updated_at to current timestamp
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for all tables that need updated_at timestamp
CREATE TRIGGER update_table1_updated_at
BEFORE UPDATE ON table1
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_table2_updated_at
BEFORE UPDATE ON table2
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Add triggers for all other necessary tables as shown above

-- Trigger for cases table to auto close case based on status
CREATE OR REPLACE FUNCTION auto_close_case_on_status()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'closed' THEN
        NEW.closed_at = NOW(); -- set closed_at to current timestamp
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_close_case
BEFORE UPDATE ON cases
FOR EACH ROW
EXECUTE FUNCTION auto_close_case_on_status();