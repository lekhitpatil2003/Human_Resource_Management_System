package hrms.hrms;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.LocalDate;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import hrms.hrms.entity.City;
import hrms.hrms.entity.Employer;
import hrms.hrms.entity.JobAdvertisement;
import hrms.hrms.entity.JobPosition;
import hrms.hrms.repository.CityDao;
import hrms.hrms.repository.EmployerDao;
import hrms.hrms.repository.JobAdvertisementDao;
import hrms.hrms.repository.JobPositionDao;
import jakarta.transaction.Transactional;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class JobAdvertisementDaoTest {

    @Autowired
    private JobAdvertisementDao jobAdvertisementDao;

    @Autowired
    private JobPositionDao jobPositionDao;

    @Autowired
    private CityDao cityDao;

    @Autowired
    private EmployerDao employerDao;

    private Employer createEmployer() {
        Employer employer = new Employer();
        employer.setCompanyName("ABC Company");
        employer.setCompanyWebPage("https://abc.com");
        employer.setEmail("abc@test.com");
        employer.setPhoneNumber("5551234567");
        employer.setPassword("123456");
        return employerDao.save(employer);
    }

    private JobPosition createPosition(String title) {
        JobPosition position = new JobPosition();
        position.setTitle(title);
        return jobPositionDao.save(position);
    }

    private City createCity(String name) {
        City city = new City();
        city.setCityName(name);
        return cityDao.save(city);
    }


    @Test
    void should_save_job_advertisement_successfully() {

        JobPosition position = createPosition("Java Developer");
        City city = createCity("Istanbul");
        Employer employer = createEmployer();

        JobAdvertisement ad = new JobAdvertisement();
        ad.setOpenPositionCount(3);
        ad.setDescription("Java backend developer position");
        ad.setMinSalary(10000);
        ad.setMaxSalary(20000);
        ad.setApplicationDeadline(LocalDate.now().plusDays(10));
        ad.setJobPosition(position);
        ad.setCity(city);
        ad.setEmployer(employer);

        JobAdvertisement saved = jobAdvertisementDao.save(ad);

        assertThat(saved.getId()).isNotNull();
        assertThat(saved.isActive()).isTrue();
    }

    @Test
    void should_fail_when_deadline_is_in_past() {

        JobAdvertisement ad = new JobAdvertisement();
        ad.setOpenPositionCount(1);
        ad.setDescription("Test job");
        ad.setApplicationDeadline(LocalDate.now().minusDays(1));

        assertThatThrownBy(() -> jobAdvertisementDao.saveAndFlush(ad));
    }

    @Test
    void should_fail_when_open_position_is_negative() {

        JobAdvertisement ad = new JobAdvertisement();
        ad.setOpenPositionCount(-5);
        ad.setDescription("Test job");
        ad.setApplicationDeadline(LocalDate.now().plusDays(5));

        assertThatThrownBy(() -> jobAdvertisementDao.saveAndFlush(ad));
    }

    @Test
    void should_link_job_position_city_employer() {

        JobPosition position = createPosition("QA Engineer");
        City city = createCity("Ankara");
        Employer employer = createEmployer();

        JobAdvertisement ad = new JobAdvertisement();
        ad.setOpenPositionCount(2);
        ad.setDescription("QA Engineer role");
        ad.setApplicationDeadline(LocalDate.now().plusDays(7));
        ad.setJobPosition(position);
        ad.setCity(city);
        ad.setEmployer(employer);

        JobAdvertisement saved = jobAdvertisementDao.save(ad);

        assertThat(saved.getJobPosition().getTitle()).isEqualTo("QA Engineer");
        assertThat(saved.getCity().getCityName()).isEqualTo("Ankara");
        assertThat(saved.getEmployer().getCompanyName()).isEqualTo("ABC Company");
    }
}
