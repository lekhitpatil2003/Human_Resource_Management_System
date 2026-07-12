package hrms.hrms;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.springframework.http.MediaType;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import hrms.hrms.entity.City;
import hrms.hrms.entity.Employer;
import hrms.hrms.entity.JobPosition;
import hrms.hrms.repository.CityDao;
import hrms.hrms.repository.EmployerDao;
import hrms.hrms.repository.JobPositionDao;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class JobAdvertisementControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JobPositionDao jobPositionDao;

    @Autowired
    private CityDao cityDao;

    @Autowired
    private EmployerDao employerDao;


    private String unique(String prefix) {
        return prefix + System.nanoTime();
    }

  
    private City createCity() {
        City city = new City();
        city.setCityName(unique("City-"));
        return cityDao.save(city);
    }


    private JobPosition createPosition() {
        JobPosition position = new JobPosition();
        position.setTitle(unique("Position-"));
        return jobPositionDao.save(position);
    }

   
    private Employer createEmployer() {
        Employer employer = new Employer();

        long id = System.nanoTime();

        employer.setCompanyName("Company-" + id);
        employer.setCompanyWebPage("https://company" + id + ".com");
        employer.setEmail("mail" + id + "@test.com");
        employer.setPhoneNumber("5551234567");
        employer.setPassword("123456");

        return employerDao.save(employer);
    }

    					

    @Test
    void should_get_all_job_advertisements() throws Exception {

        mockMvc.perform(get("/api/jobPost/getAll"))
                .andExpect(status().isOk());
    }

    @Test
    void should_create_job_advertisement() throws Exception {

        JobPosition position = createPosition();
        City city = createCity();
        Employer employer = createEmployer();

        String json = String.format("""
        {
            "openPositionCount": 2,
            "description": "Java Developer",
            "minSalary": 10000,
            "maxSalary": 20000,
            "applicationDeadline": "2030-01-01",
            "jobPositionId": %d,
            "cityId": %d,
            "employerId": %d
        }
        """, position.getId(), city.getId(), employer.getId());

        mockMvc.perform(post("/api/jobPost/add")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json))
                .andExpect(status().isOk());
    }

    @Test
    void should_fail_when_description_is_empty() throws Exception {

        JobPosition position = createPosition();
        City city = createCity();
        Employer employer = createEmployer();

        String json = String.format("""
        {
            "openPositionCount": 2,
            "description": "",
            "minSalary": 10000,
            "maxSalary": 20000,
            "applicationDeadline": "2030-01-01",
            "jobPositionId": %d,
            "cityId": %d,
            "employerId": %d
        }
        """, position.getId(), city.getId(), employer.getId());

        mockMvc.perform(post("/api/jobPost/add")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json))
                .andExpect(status().isBadRequest());
    }
}
